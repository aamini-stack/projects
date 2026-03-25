import { resolve } from 'node:path'

const STACK_KEY_ORDER = [
	'organization/global',
	'platform/staging',
	'platform/production',
] as const
import type {
	BootstrapContext,
	BootstrapPlan,
	EnvironmentTarget,
	ProjectTarget,
	StackDefinition,
} from './types.ts'

export function buildBootstrapPlan(context: BootstrapContext): BootstrapPlan {
	const stackDefs = buildStackDefinitions(context)
	const selectedStacks = resolveStackSelection(
		stackDefs,
		context.projectTarget,
		context.environmentTarget,
	)

	if (selectedStacks.length === 0) {
		throw new Error(
			`No stacks matched --project ${context.projectTarget} and --environment ${context.environmentTarget}.`,
		)
	}

	const executionPlan =
		context.command === 'destroy'
			? sortStacksForDestroy(selectedStacks)
			: sortStacksForUp(selectedStacks)

	return {
		context,
		selectedStacks,
		executionPlan,
	}
}

function buildStackDefinitions(context: BootstrapContext): StackDefinition[] {
	return [
		{
			key: 'organization/global',
			project: 'organization',
			environment: 'global',
			workDir: resolve(context.infraDir, 'src/programs/organization'),
			stack: 'global',
			config: {
				'organization:organization': {
					value: JSON.stringify({
						region: context.region,
						managementAccountId: context.managementAccount.Id,
					}),
				},
				'organization:identity': {
					value: JSON.stringify({
						assumeRoleName: context.identityAssumeRoleName,
						adminsGroupId: context.adminsGroup.GroupId,
						developersGroupId: context.developersGroup.GroupId,
						readOnlyGroupId: context.readOnlyGroup.GroupId,
					}),
				},
				'organization:accounts': {
					value: JSON.stringify({
						staging: {
							accountId: context.stagingAccount.Id,
							assumeRoleName: context.stagingAssumeRoleName,
						},
						production: {
							accountId: context.productionAccount.Id,
							assumeRoleName: context.productionAssumeRoleName,
						},
						requested: JSON.parse(context.requestedAccounts),
					}),
				},
				'organization:guardrails': {
					value: JSON.stringify({
						billingAlertEmail: context.billingAlertEmail,
						ciCdPrincipalArn: context.ciCdPrincipalArn,
						staging: {
							budgetLimitUsd: Number(context.stagingBudgetUsd),
						},
						production: {
							budgetLimitUsd: Number(context.productionBudgetUsd),
						},
					}),
				},
			},
		},
		{
			key: 'platform/staging',
			project: 'platform',
			environment: 'staging',
			workDir: resolve(context.infraDir, 'src/programs/platform'),
			stack: 'staging',
			config: buildPlatformConfig({
				accountId: context.stagingAccount.Id,
				environment: 'staging',
				assumeRoleName: context.stagingAssumeRoleName,
				managementAccountId: context.managementAccount.Id,
				region: context.region,
				workloadBucketName: 'aamini-staging-workloads',
				ciCdPrincipalArn: context.ciCdPrincipalArn,
				repo: context.repo,
				trustedPrincipalArn: context.trustedPrincipalArn,
				sharedKubernetesConfig: context.sharedKubernetesConfig,
				sharedPostgresConfig: context.sharedPostgresConfig,
				cloudflareOriginHostname: context.cloudflareOriginHostname,
				githubToken: context.githubToken,
				cloudflareApiTokenInput: context.cloudflareApiTokenInput,
				cloudflareEmailInput: context.cloudflareEmailInput,
				cloudflareApiKeyInput: context.cloudflareApiKeyInput,
				postgresAdminPassword: context.postgresAdminPassword,
			}),
		},
		{
			key: 'platform/production',
			project: 'platform',
			environment: 'production',
			workDir: resolve(context.infraDir, 'src/programs/platform'),
			stack: 'production',
			config: buildPlatformConfig({
				accountId: context.productionAccount.Id,
				environment: 'production',
				assumeRoleName: context.productionAssumeRoleName,
				managementAccountId: context.managementAccount.Id,
				region: context.region,
				workloadBucketName: 'aamini-production-workloads',
				ciCdPrincipalArn: context.ciCdPrincipalArn,
				repo: context.repo,
				trustedPrincipalArn: context.trustedPrincipalArn,
				sharedKubernetesConfig: context.sharedKubernetesConfig,
				sharedPostgresConfig: context.sharedPostgresConfig,
				cloudflareOriginHostname: context.cloudflareOriginHostname,
				githubToken: context.githubToken,
				cloudflareApiTokenInput: context.cloudflareApiTokenInput,
				cloudflareEmailInput: context.cloudflareEmailInput,
				cloudflareApiKeyInput: context.cloudflareApiKeyInput,
				postgresAdminPassword: context.postgresAdminPassword,
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

function resolveStackSelection(
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

function sortStacksForUp(stacks: StackDefinition[]): StackDefinition[] {
	const order = new Map<string, number>(
		STACK_KEY_ORDER.map((key, index) => [key, index]),
	)

	return [...stacks].sort((left, right) => {
		const leftIndex = order.get(left.key) ?? Number.MAX_SAFE_INTEGER
		const rightIndex = order.get(right.key) ?? Number.MAX_SAFE_INTEGER
		return leftIndex - rightIndex
	})
}

function sortStacksForDestroy(stacks: StackDefinition[]): StackDefinition[] {
	return sortStacksForUp(stacks).reverse()
}

export function formatStackLabel(stack: StackDefinition, org: string): string {
	return `${stack.key} (${org}/${stack.stack})`
}

export function printBootstrapPlan(plan: BootstrapPlan): void {
	const { context, executionPlan } = plan

	console.log('Bootstrap preflight:')
	console.log(`- profile: ${context.profile}`)
	console.log(`- region: ${context.region}`)
	console.log(`- pulumi org: ${context.org}`)
	console.log(
		`- mode: ${context.nonInteractive ? 'non-interactive' : 'interactive'}`,
	)

	console.log('Resolved bootstrap plan:')
	console.log(
		`- command: ${context.command}${context.preview ? ' (preview)' : ''}`,
	)
	console.log(`- pulumi org: ${context.org}`)
	console.log(`- profile: ${context.profile}`)
	console.log(`- region: ${context.region}`)
	console.log(`- caller arn: ${context.caller.Arn}`)
	console.log(
		`- management account: ${context.managementAccount.Name} (${context.managementAccount.Id})`,
	)
	console.log(
		`- staging account: ${context.stagingAccount.Name} (${context.stagingAccount.Id})`,
	)
	console.log(
		`- production account: ${context.productionAccount.Name} (${context.productionAccount.Id})`,
	)
	console.log(`- identity store id: ${context.ssoInstance.IdentityStoreId}`)
	console.log(`- admins group id: ${context.adminsGroup.GroupId}`)
	console.log(`- developers group id: ${context.developersGroup.GroupId}`)
	console.log(`- readonly group id: ${context.readOnlyGroup.GroupId}`)
	console.log(`- requested accounts json: ${context.requestedAccounts}`)
	console.log(`- identity assume role: ${context.identityAssumeRoleName}`)
	console.log(`- staging assume role: ${context.stagingAssumeRoleName}`)
	console.log(`- production assume role: ${context.productionAssumeRoleName}`)
	console.log(`- repo: ${context.repo}`)
	console.log(`- trusted principal arn: ${context.trustedPrincipalArn}`)
	console.log(
		`- stack timeout: ${context.stackOperationTimeoutMinutes} minute(s)`,
	)
	console.log(`- stack retries: ${context.stackOperationRetries}`)

	if (executionPlan.some((stack) => stack.project === 'platform')) {
		if (!context.githubTokenInput) {
			console.log(
				'- github token: missing, using generated placeholder for bootstrap (set --github-token for production use)',
			)
		} else {
			console.log('- github token: provided')
		}

		if (!context.postgresPasswordInput) {
			console.log(
				'- postgres admin password: missing, generated one-time password for bootstrap',
			)
		} else {
			console.log('- postgres admin password: provided')
		}

		console.log(
			`- cloudflare origin hostname: ${context.cloudflareOriginHostname}`,
		)
		console.log(
			`- cloudflare auth mode: ${
				context.hasCloudflareApiToken
					? 'api token'
					: context.hasCloudflareGlobalKey
						? 'global key'
						: 'using existing stack config'
			}`,
		)
	}

	console.log('- execution order:')
	for (const stack of executionPlan) {
		console.log(`  - ${formatStackLabel(stack, context.org)}`)
	}
}
