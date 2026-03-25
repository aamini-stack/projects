import { runAwsJson } from './cli.ts'
import type { AssumedRoleCredentials, AwsIamGetRoleResponse } from './types.ts'

export function hasIamRole(input: {
	region: string
	roleName: string
	profile?: string
	credentials?: AssumedRoleCredentials
}): boolean {
	try {
		runAwsJson<AwsIamGetRoleResponse>(
			['iam', 'get-role', '--role-name', input.roleName],
			{
				profile: input.profile,
				region: input.region,
				credentials: input.credentials,
			},
		)
		return true
	} catch {
		return false
	}
}

function toIamRoleArnFromAssumedRoleArn(arn: string): string | undefined {
	const match = /^arn:aws:sts::(\d+):assumed-role\/([^/]+)\/.+$/.exec(arn)
	if (!match) {
		return undefined
	}

	const accountId = match[1]
	const roleName = match[2]
	if (!accountId || !roleName) {
		return undefined
	}

	return `arn:aws:iam::${accountId}:role/${roleName}`
}

export function resolveCiCdPrincipalArn(
	managementAccountId: string,
	ciCdRoleName: string,
	callerArn: string,
	profile: string,
	region: string,
): string {
	const preferredRoleArn = `arn:aws:iam::${managementAccountId}:role/${ciCdRoleName}`
	if (hasIamRole({ profile, region, roleName: ciCdRoleName })) {
		return preferredRoleArn
	}

	const callerRoleArn = toIamRoleArnFromAssumedRoleArn(callerArn)
	if (callerRoleArn?.startsWith(`arn:aws:iam::${managementAccountId}:role/`)) {
		console.log(
			`- CI/CD role '${ciCdRoleName}' not found in management account; falling back to caller role principal ${callerRoleArn}`,
		)
		return callerRoleArn
	}

	const rootArn = `arn:aws:iam::${managementAccountId}:root`
	console.log(
		`- CI/CD role '${ciCdRoleName}' not found in management account; falling back to management root principal ${rootArn}`,
	)
	return rootArn
}
