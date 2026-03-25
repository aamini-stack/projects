import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

import { buildAwsEnv } from '../aws/cli.ts'
import type { AssumedRoleCredentials } from '../aws/types.ts'
import { execText } from '../process/exec.ts'

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
