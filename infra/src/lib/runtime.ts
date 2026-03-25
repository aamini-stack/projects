import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

import type { AssumedRoleCredentials } from './aws.ts'

const DEFAULT_REGION = 'us-east-1'

type ExecOptions = {
	cmd: string
	args: string[]
	cwd?: string
	env?: NodeJS.ProcessEnv
	stdio?: 'inherit' | ['ignore', 'pipe', 'pipe']
	encoding?: BufferEncoding
}

function buildAwsEnv(input: {
	profile?: string | undefined
	region?: string | undefined
	credentials?: AssumedRoleCredentials | undefined
}): NodeJS.ProcessEnv {
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

export function execText(options: ExecOptions): string {
	return execFileSync(options.cmd, options.args, {
		cwd: options.cwd,
		encoding: options.encoding ?? 'utf8',
		env: options.env,
		stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
	})
}

export function execJson<T>(options: ExecOptions): T {
	return JSON.parse(execText(options)) as T
}

export function execPassthrough(options: Omit<ExecOptions, 'stdio'>): void {
	execFileSync(options.cmd, options.args, {
		cwd: options.cwd,
		encoding: options.encoding ?? 'utf8',
		env: options.env,
		stdio: 'inherit',
	})
}

export function withTempKubeconfig<T>(
	contents: string,
	fn: (kubeconfigPath: string) => T,
): T {
	const tempDir = mkdtempSync(resolve(tmpdir(), 'kubeconfig-'))
	const kubeconfigPath = resolve(tempDir, 'kubeconfig')
	writeFileSync(kubeconfigPath, contents, { mode: 0o600 })

	try {
		return fn(kubeconfigPath)
	} finally {
		rmSync(tempDir, { force: true, recursive: true })
	}
}

export function withTempEksKubeconfig<T>(input: {
	clusterName: string
	region: string
	profile?: string
	credentials?: AssumedRoleCredentials
	fn: (kubeconfigPath: string) => T
}): T {
	const tempDir = mkdtempSync(resolve(tmpdir(), 'destroy-verify-'))
	const kubeconfigPath = resolve(tempDir, 'kubeconfig')

	try {
		execText({
			cmd: 'aws',
			args: [
				'eks',
				'update-kubeconfig',
				'--name',
				input.clusterName,
				'--kubeconfig',
				kubeconfigPath,
			],
			env: buildAwsEnv({
				profile: input.profile,
				region: input.region,
				credentials: input.credentials,
			}),
		})

		return input.fn(kubeconfigPath)
	} finally {
		rmSync(tempDir, { force: true, recursive: true })
	}
}
