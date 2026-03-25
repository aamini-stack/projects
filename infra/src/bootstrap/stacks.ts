import { resolve } from 'node:path'

import { STACK_KEY_ORDER } from './constants.ts'
import type {
	EnvironmentTarget,
	ProjectTarget,
	StackDefinition,
} from './types.ts'

type BuildStackDefinitionsInput = {
	infraDir: string
	managementAccountId: string
	stagingAccountId: string
	productionAccountId: string
	identityAssumeRoleName: string
	stagingAssumeRoleName: string
	productionAssumeRoleName: string
	region: string
	adminsGroupId: string
	developersGroupId: string
	readOnlyGroupId: string
	requestedAccounts: string
	organizationImportsConfig: {
		importedAccounts: string
		importedPolicies: string
	}
	billingAlertEmail: string
	stagingBudgetUsd: string
	productionBudgetUsd: string
	ciCdPrincipalArn: string
	repo: string
	trustedPrincipalArn: string
	sharedKubernetesConfig: string
	sharedPostgresConfig: string
	cloudflareOriginHostname: string
	githubToken: string
	cloudflareApiTokenInput: string | undefined
	cloudflareEmailInput: string | undefined
	cloudflareApiKeyInput: string | undefined
	postgresAdminPassword: string
}

export function buildStackDefinitions(
	input: BuildStackDefinitionsInput,
): StackDefinition[] {
	return [
		{
			key: 'organization/global',
			project: 'organization',
			environment: 'global',
			workDir: resolve(input.infraDir, 'src/organization'),
			stack: 'global',
			config: {
				'organization:organization': {
					value: JSON.stringify({
						region: input.region,
						managementAccountId: input.managementAccountId,
					}),
				},
				'organization:identity': {
					value: JSON.stringify({
						assumeRoleName: input.identityAssumeRoleName,
						adminsGroupId: input.adminsGroupId,
						developersGroupId: input.developersGroupId,
						readOnlyGroupId: input.readOnlyGroupId,
					}),
				},
				'organization:accounts': {
					value: JSON.stringify({
						staging: {
							accountId: input.stagingAccountId,
							assumeRoleName: input.stagingAssumeRoleName,
						},
						production: {
							accountId: input.productionAccountId,
							assumeRoleName: input.productionAssumeRoleName,
						},
						requested: JSON.parse(input.requestedAccounts),
					}),
				},
				'organization:guardrails': {
					value: JSON.stringify({
						billingAlertEmail: input.billingAlertEmail,
						ciCdPrincipalArn: input.ciCdPrincipalArn,
						staging: {
							budgetLimitUsd: Number(input.stagingBudgetUsd),
						},
						production: {
							budgetLimitUsd: Number(input.productionBudgetUsd),
						},
					}),
				},
				'organization:imports': {
					value: JSON.stringify({
						accounts: JSON.parse(
							input.organizationImportsConfig.importedAccounts,
						),
						policies: JSON.parse(
							input.organizationImportsConfig.importedPolicies,
						),
					}),
				},
			},
		},
		{
			key: 'platform/staging',
			project: 'platform',
			environment: 'staging',
			workDir: resolve(input.infraDir, 'src/platform'),
			stack: 'staging',
			config: buildPlatformConfig({
				accountId: input.stagingAccountId,
				environment: 'staging',
				assumeRoleName: input.stagingAssumeRoleName,
				managementAccountId: input.managementAccountId,
				region: input.region,
				workloadBucketName: 'aamini-staging-workloads',
				ciCdPrincipalArn: input.ciCdPrincipalArn,
				repo: input.repo,
				trustedPrincipalArn: input.trustedPrincipalArn,
				sharedKubernetesConfig: input.sharedKubernetesConfig,
				sharedPostgresConfig: input.sharedPostgresConfig,
				cloudflareOriginHostname: input.cloudflareOriginHostname,
				githubToken: input.githubToken,
				cloudflareApiTokenInput: input.cloudflareApiTokenInput,
				cloudflareEmailInput: input.cloudflareEmailInput,
				cloudflareApiKeyInput: input.cloudflareApiKeyInput,
				postgresAdminPassword: input.postgresAdminPassword,
			}),
		},
		{
			key: 'platform/production',
			project: 'platform',
			environment: 'production',
			workDir: resolve(input.infraDir, 'src/platform'),
			stack: 'production',
			config: buildPlatformConfig({
				accountId: input.productionAccountId,
				environment: 'production',
				assumeRoleName: input.productionAssumeRoleName,
				managementAccountId: input.managementAccountId,
				region: input.region,
				workloadBucketName: 'aamini-production-workloads',
				ciCdPrincipalArn: input.ciCdPrincipalArn,
				repo: input.repo,
				trustedPrincipalArn: input.trustedPrincipalArn,
				sharedKubernetesConfig: input.sharedKubernetesConfig,
				sharedPostgresConfig: input.sharedPostgresConfig,
				cloudflareOriginHostname: input.cloudflareOriginHostname,
				githubToken: input.githubToken,
				cloudflareApiTokenInput: input.cloudflareApiTokenInput,
				cloudflareEmailInput: input.cloudflareEmailInput,
				cloudflareApiKeyInput: input.cloudflareApiKeyInput,
				postgresAdminPassword: input.postgresAdminPassword,
			}),
		},
	]
}

function buildPlatformConfig(input: {
	accountId: string
	environment: 'staging' | 'production'
	managementAccountId: string
	assumeRoleName: string
	region: string
	workloadBucketName: string
	ciCdPrincipalArn: string
	repo: string
	trustedPrincipalArn: string
	sharedKubernetesConfig: string
	sharedPostgresConfig: string
	cloudflareOriginHostname: string
	githubToken: string
	cloudflareApiTokenInput: string | undefined
	cloudflareEmailInput: string | undefined
	cloudflareApiKeyInput: string | undefined
	postgresAdminPassword: string
}): StackDefinition['config'] {
	return {
		'platform:accountId': { value: input.accountId },
		'platform:environment': { value: input.environment },
		'platform:managementAccountId': { value: input.managementAccountId },
		'platform:assumeRoleName': { value: input.assumeRoleName },
		'platform:region': { value: input.region },
		'aws:region': { value: input.region },
		'platform:workloadBucketName': { value: input.workloadBucketName },
		'platform:ciCdPrincipalArn': { value: input.ciCdPrincipalArn },
		'platform:repo': { value: input.repo },
		'platform:deployerTrustedPrincipalArn': {
			value: input.trustedPrincipalArn,
		},
		'platform:kubernetes': { value: input.sharedKubernetesConfig },
		'platform:postgres': { value: input.sharedPostgresConfig },
		'platform:cloudflareOriginHostname': {
			value: input.cloudflareOriginHostname,
		},
		'github:token': { value: input.githubToken, secret: true },
		...(input.cloudflareApiTokenInput
			? {
					'cloudflare:apiToken': {
						value: input.cloudflareApiTokenInput,
						secret: true,
					},
				}
			: input.cloudflareEmailInput && input.cloudflareApiKeyInput
				? {
						'cloudflare:email': { value: input.cloudflareEmailInput },
						'cloudflare:apiKey': {
							value: input.cloudflareApiKeyInput,
							secret: true,
						},
					}
				: {}),
		'platform:postgresAdminPassword': {
			value: input.postgresAdminPassword,
			secret: true,
		},
	}
}

export function resolveStackSelection(
	stacks: StackDefinition[],
	projectTarget: ProjectTarget,
	environmentTarget: EnvironmentTarget,
): StackDefinition[] {
	return stacks.filter((stack) => {
		if (projectTarget !== 'all' && stack.project !== projectTarget) {
			return false
		}

		if (
			environmentTarget !== 'all' &&
			stack.environment !== environmentTarget
		) {
			return false
		}

		return true
	})
}

export function sortStacksForUp(stacks: StackDefinition[]): StackDefinition[] {
	const order = new Map<string, number>(
		STACK_KEY_ORDER.map((key, index) => [key, index]),
	)

	return [...stacks].sort((left, right) => {
		const leftIndex = order.get(left.key) ?? Number.MAX_SAFE_INTEGER
		const rightIndex = order.get(right.key) ?? Number.MAX_SAFE_INTEGER
		return leftIndex - rightIndex
	})
}

export function sortStacksForDestroy(
	stacks: StackDefinition[],
): StackDefinition[] {
	return sortStacksForUp(stacks).reverse()
}

export function formatStackLabel(stack: StackDefinition, org: string): string {
	return `${stack.key} (${org}/${stack.stack})`
}
