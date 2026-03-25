const DEFAULT_REGION = 'us-east-1'
import { execJson, execPassthrough } from '../process/exec.ts'
import type { AssumedRoleCredentials } from './types.ts'

type RunAwsJsonInput = {
	profile?: string | undefined
	region?: string | undefined
	credentials?: AssumedRoleCredentials | undefined
}

let awsNonInteractiveMode = false

export function setAwsNonInteractiveMode(enabled: boolean): void {
	awsNonInteractiveMode = enabled
}

export function buildAwsEnv(input: RunAwsJsonInput): NodeJS.ProcessEnv {
	const env = { ...process.env }
	const resolvedRegion =
		input.region ??
		process.env.AWS_REGION ??
		process.env.AWS_DEFAULT_REGION ??
		DEFAULT_REGION

	env.AWS_REGION = resolvedRegion
	env.AWS_DEFAULT_REGION = resolvedRegion

	if (input.profile) {
		env.AWS_PROFILE = input.profile
	}

	if (input.credentials) {
		env.AWS_ACCESS_KEY_ID = input.credentials.AccessKeyId
		env.AWS_SECRET_ACCESS_KEY = input.credentials.SecretAccessKey
		env.AWS_SESSION_TOKEN = input.credentials.SessionToken
		delete env.AWS_PROFILE
	}

	return env
}

export function runAwsJson<T>(args: string[], input: RunAwsJsonInput = {}): T {
	const env = buildAwsEnv(input)
	const execute = (): T =>
		execJson<T>({
			cmd: 'aws',
			args: [...args, '--output', 'json'],
			env,
		})

	try {
		return execute()
	} catch (error: unknown) {
		if (
			input.profile &&
			awsNonInteractiveMode &&
			isAwsSsoTokenExpiredError(error)
		) {
			throw new Error(
				`AWS SSO token expired for profile '${input.profile}' while --non-interactive is enabled. Run 'aws sso login --profile ${input.profile}' and retry.`,
			)
		}

		if (input.profile && isAwsSsoTokenExpiredError(error)) {
			console.log(
				`AWS SSO token expired for profile '${input.profile}', running aws sso login...`,
			)
			execPassthrough({
				cmd: 'aws',
				args: ['sso', 'login', '--profile', input.profile],
				env,
			})

			return execute()
		}

		throw error
	}
}

function isAwsSsoTokenExpiredError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false
	}

	const message = error.message.toLowerCase()
	return (
		message.includes('token has expired') ||
		message.includes('error when retrieving token from sso') ||
		message.includes('sso login')
	)
}
