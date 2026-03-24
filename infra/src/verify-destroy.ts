import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { parseArgs } from 'node:util'

type AwsAccount = {
	Id: string
	Name: string
	Status: string
}

type AssumedRoleCredentials = {
	AccessKeyId: string
	SecretAccessKey: string
	SessionToken: string
}

const DEFAULT_REGION = 'us-east-1'
const DEFAULT_ASSUME_ROLE_NAME = 'AWSControlTowerExecution'
const DEFAULT_STAGING_ACCOUNT_NAME = 'aamini-staging'
const DEFAULT_PRODUCTION_ACCOUNT_NAME = 'aamini-production'
const DEFAULT_FLUX_ROLE_NAME = 'flux-ecr-readonly'
const DEFAULT_CLUSTER_PREFIX = 'aamini'

function runAwsJson<T>(
	args: string[],
	envOverrides: Record<string, string>,
): T {
	const env = { ...process.env, ...envOverrides }
	const output = execFileSync('aws', [...args, '--output', 'json'], {
		encoding: 'utf8',
		env,
		stdio: ['ignore', 'pipe', 'pipe'],
	})

	return JSON.parse(output) as T
}

function accountByName(accounts: AwsAccount[], name: string): AwsAccount {
	const account = accounts.find((item) => item.Name === name)
	if (!account) {
		throw new Error(`Account '${name}' not found in AWS Organizations`)
	}

	if (account.Status !== 'ACTIVE') {
		throw new Error(`Account '${name}' is not ACTIVE`)
	}

	return account
}

function listOrganizationAccounts(input: {
	profile: string
	region: string
}): AwsAccount[] {
	const accounts: AwsAccount[] = []
	let nextToken: string | undefined

	do {
		const response = runAwsJson<{
			Accounts: AwsAccount[]
			NextToken?: string
		}>(
			[
				'organizations',
				'list-accounts',
				...(nextToken ? ['--next-token', nextToken] : []),
			],
			{
				AWS_PROFILE: input.profile,
				AWS_REGION: input.region,
				AWS_DEFAULT_REGION: input.region,
			},
		)
		accounts.push(...response.Accounts)
		nextToken = response.NextToken
	} while (nextToken)

	return accounts
}

function assumeAccountRole(input: {
	managementProfile: string
	region: string
	accountId: string
	roleName: string
}): AssumedRoleCredentials {
	const session = runAwsJson<{
		Credentials: AssumedRoleCredentials
	}>(
		[
			'sts',
			'assume-role',
			'--role-arn',
			`arn:aws:iam::${input.accountId}:role/${input.roleName}`,
			'--role-session-name',
			'destroy-verification',
		],
		{
			AWS_PROFILE: input.managementProfile,
			AWS_REGION: input.region,
			AWS_DEFAULT_REGION: input.region,
		},
	)

	return session.Credentials
}

function hasIamRole(input: {
	region: string
	creds: AssumedRoleCredentials
	roleName: string
}): boolean {
	try {
		runAwsJson(['iam', 'get-role', '--role-name', input.roleName], {
			AWS_ACCESS_KEY_ID: input.creds.AccessKeyId,
			AWS_SECRET_ACCESS_KEY: input.creds.SecretAccessKey,
			AWS_SESSION_TOKEN: input.creds.SessionToken,
			AWS_REGION: input.region,
			AWS_DEFAULT_REGION: input.region,
		})
		return true
	} catch {
		return false
	}
}

function listEksClusters(input: {
	region: string
	creds: AssumedRoleCredentials
}): string[] {
	const response = runAwsJson<{ clusters: string[] }>(
		['eks', 'list-clusters'],
		{
			AWS_ACCESS_KEY_ID: input.creds.AccessKeyId,
			AWS_SECRET_ACCESS_KEY: input.creds.SecretAccessKey,
			AWS_SESSION_TOKEN: input.creds.SessionToken,
			AWS_REGION: input.region,
			AWS_DEFAULT_REGION: input.region,
		},
	)

	return response.clusters
}

function canRunKubectl(): boolean {
	try {
		execFileSync('kubectl', ['version', '--client'], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
		})
		return true
	} catch {
		return false
	}
}

function checkFluxNamespace(input: {
	region: string
	clusterName: string
	creds: AssumedRoleCredentials
}): boolean {
	if (!canRunKubectl()) {
		console.log('- flux-system namespace check skipped (kubectl not installed)')
		return false
	}

	const tempDir = mkdtempSync(resolve(tmpdir(), 'destroy-verify-'))
	const kubeconfigPath = resolve(tempDir, 'kubeconfig')
	const awsEnv = {
		...process.env,
		AWS_ACCESS_KEY_ID: input.creds.AccessKeyId,
		AWS_SECRET_ACCESS_KEY: input.creds.SecretAccessKey,
		AWS_SESSION_TOKEN: input.creds.SessionToken,
		AWS_REGION: input.region,
		AWS_DEFAULT_REGION: input.region,
	}

	try {
		execFileSync(
			'aws',
			[
				'eks',
				'update-kubeconfig',
				'--name',
				input.clusterName,
				'--kubeconfig',
				kubeconfigPath,
			],
			{
				encoding: 'utf8',
				env: awsEnv,
				stdio: ['ignore', 'pipe', 'pipe'],
			},
		)

		execFileSync(
			'kubectl',
			['get', 'namespace', 'flux-system', '--kubeconfig', kubeconfigPath],
			{
				encoding: 'utf8',
				stdio: ['ignore', 'pipe', 'pipe'],
			},
		)
		return true
	} catch {
		return false
	} finally {
		rmSync(tempDir, { force: true, recursive: true })
	}
}

function main(): void {
	const { values } = parseArgs({
		args: process.argv.slice(2).filter((arg) => arg !== '--'),
		options: {
			profile: { type: 'string' },
			region: { type: 'string' },
			'assume-role-name': { type: 'string' },
			'staging-account-name': { type: 'string' },
			'production-account-name': { type: 'string' },
			'flux-role-name': { type: 'string' },
			'cluster-prefix': { type: 'string' },
		},
	})

	const profile = values.profile ?? process.env.AWS_PROFILE
	if (!profile) {
		throw new Error('Missing AWS profile. Pass --profile or set AWS_PROFILE.')
	}

	const region = values.region ?? DEFAULT_REGION
	const assumeRoleName = values['assume-role-name'] ?? DEFAULT_ASSUME_ROLE_NAME
	const stagingAccountName =
		values['staging-account-name'] ?? DEFAULT_STAGING_ACCOUNT_NAME
	const productionAccountName =
		values['production-account-name'] ?? DEFAULT_PRODUCTION_ACCOUNT_NAME
	const fluxRoleName = values['flux-role-name'] ?? DEFAULT_FLUX_ROLE_NAME
	const clusterPrefix = values['cluster-prefix'] ?? DEFAULT_CLUSTER_PREFIX

	const accounts = listOrganizationAccounts({ profile, region })

	const targetEnvironments = [
		{ name: 'staging', account: accountByName(accounts, stagingAccountName) },
		{
			name: 'production',
			account: accountByName(accounts, productionAccountName),
		},
	] as const

	let failures = 0
	for (const target of targetEnvironments) {
		console.log(`Checking ${target.name} (${target.account.Id})`)
		const creds = assumeAccountRole({
			managementProfile: profile,
			region,
			accountId: target.account.Id,
			roleName: assumeRoleName,
		})

		const expectedClusterName = `${clusterPrefix}-${target.name}`
		const clusters = listEksClusters({ region, creds })
		if (clusters.includes(expectedClusterName)) {
			failures += 1
			console.log(`- fail: EKS cluster still exists (${expectedClusterName})`)
			const hasFluxNamespace = checkFluxNamespace({
				region,
				clusterName: expectedClusterName,
				creds,
			})
			if (hasFluxNamespace) {
				failures += 1
				console.log('- fail: flux-system namespace still exists')
			} else {
				console.log('- pass: flux-system namespace not found')
			}
		} else {
			console.log(`- pass: EKS cluster removed (${expectedClusterName})`)
			console.log('- pass: flux-system namespace removed with cluster')
		}

		const fluxRoleExists = hasIamRole({ region, creds, roleName: fluxRoleName })
		if (fluxRoleExists) {
			failures += 1
			console.log(`- fail: IAM role still exists (${fluxRoleName})`)
		} else {
			console.log(`- pass: IAM role removed (${fluxRoleName})`)
		}
	}

	if (failures > 0) {
		throw new Error(`Destroy verification failed with ${failures} issue(s).`)
	}

	console.log('Destroy verification passed.')
}

try {
	main()
} catch (error: unknown) {
	const message = error instanceof Error ? error.message : String(error)
	console.error(`Destroy verification failed: ${message}`)
	process.exit(1)
}
