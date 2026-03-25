import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { rmSync } from 'node:fs'

import {
	buildDefaultOrganizationSelection,
	buildOrganizationImportsConfig,
	getCallerIdentity,
	getOrCreateIdentityGroup,
	getSsoInstance,
	listIdentityStoreGroups,
	listOrganizationAccounts,
	loadOrganizationInventory,
	parseJsonOption,
	resolveAssumeRoleNameForAccount,
	resolveCiCdPrincipalArn,
	resolveManagementIdentityAssumeRoleName,
	resolveProfile,
	resolveSelectedOrganizationAccount,
	setAwsNonInteractiveMode,
} from './bootstrap/aws.ts'
import {
	DEFAULT_ADMINS_GROUP_NAME,
	DEFAULT_ASSUME_ROLE_NAME,
	DEFAULT_BILLING_ALERT_EMAIL,
	DEFAULT_CICD_ROLE_NAME,
	DEFAULT_CLOUDFLARE_ORIGIN_HOSTNAME,
	DEFAULT_DEVELOPERS_GROUP_NAME,
	DEFAULT_MANAGEMENT_ACCOUNT_NAME,
	DEFAULT_PRODUCTION_ACCOUNT_NAME,
	DEFAULT_PRODUCTION_BUDGET_USD,
	DEFAULT_READONLY_GROUP_NAME,
	DEFAULT_REGION,
	DEFAULT_REPO,
	DEFAULT_REQUESTED_ACCOUNTS,
	DEFAULT_STACK_OPERATION_RETRIES,
	DEFAULT_STACK_OPERATION_TIMEOUT_MINUTES,
	DEFAULT_STAGING_ACCOUNT_NAME,
	DEFAULT_STAGING_BUDGET_USD,
} from './bootstrap/constants.ts'
import {
	createEphemeralDockerConfig,
	destroyOrPreviewDestroyStack,
	includesPlatform,
	upOrPreviewStack,
} from './bootstrap/execution.ts'
import {
	buildStackDefinitions,
	formatStackLabel,
	resolveStackSelection,
	sortStacksForDestroy,
	sortStacksForUp,
} from './bootstrap/stacks.ts'
import type {
	BootstrapOrganizationSelection,
	Command,
	EnvironmentTarget,
	OrganizationInventory,
	ProjectTarget,
} from './bootstrap/types.ts'

function runPulumiWhoAmI(): string {
	const output = execFileSync('pulumi', ['whoami'], {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	})

	return output.trim()
}

function parseCommand(value: string | undefined): Command {
	if (!value || value === 'up') {
		return 'up'
	}

	if (value === 'destroy') {
		return 'destroy'
	}

	throw new Error("Invalid command. Expected 'up' or 'destroy'.")
}

function parseProjectTarget(value: string): ProjectTarget {
	if (value === 'all' || value === 'organization' || value === 'platform') {
		return value
	}

	throw new Error(
		`Invalid --project '${value}'. Expected one of: all, organization, platform.`,
	)
}

function parseEnvironmentTarget(value: string): EnvironmentTarget {
	if (
		value === 'all' ||
		value === 'global' ||
		value === 'staging' ||
		value === 'production'
	) {
		return value
	}

	throw new Error(
		`Invalid --environment '${value}'. Expected one of: all, global, staging, production.`,
	)
}

function printUsage(): void {
	console.log('Usage: pnpm bootstrap -- [up|destroy] [options]')
	console.log('')
	console.log('Examples:')
	console.log('  pnpm bootstrap -- up --profile aamini-root')
	console.log('  pnpm bootstrap -- up --preview')
	console.log('  pnpm bootstrap -- up --check --project organization')
	console.log(
		'  pnpm bootstrap -- destroy --project platform --environment staging --remove-stacks',
	)
	console.log(
		'  pnpm bootstrap -- up --stack-timeout-minutes 60 --stack-retries 3',
	)
	console.log('')
	console.log('Profile resolution order:')
	console.log('  1) --profile')
	console.log('  2) AWS_PROFILE')
	console.log('  3) AWS_DEFAULT_PROFILE')
}

async function main(): Promise<void> {
	const cliArgs = process.argv.slice(2).filter((arg) => arg !== '--')

	const { values, positionals } = parseArgs({
		args: cliArgs,
		allowPositionals: true,
		options: {
			help: { type: 'boolean', default: false },
			check: { type: 'boolean' },
			nonInteractive: { type: 'boolean' },
			org: { type: 'string' },
			profile: { type: 'string' },
			region: { type: 'string' },
			preview: { type: 'boolean', default: false },
			dryRun: { type: 'boolean', default: false },
			project: { type: 'string', default: 'all' },
			environment: { type: 'string', default: 'all' },
			'remove-stacks': { type: 'boolean', default: false },
			'assume-role-name': { type: 'string' },
			'identity-assume-role-name': { type: 'string' },
			'cicd-role-name': { type: 'string' },
			'requested-accounts': { type: 'string' },
			'organization-topology': { type: 'string' },
			'organization-inventory': { type: 'string' },
			'management-account-name': { type: 'string' },
			'staging-account-name': { type: 'string' },
			'production-account-name': { type: 'string' },
			'admins-group-name': { type: 'string' },
			'developers-group-name': { type: 'string' },
			'readonly-group-name': { type: 'string' },
			'create-missing-groups': { type: 'boolean' },
			repo: { type: 'string' },
			'deployer-trusted-principal-arn': { type: 'string' },
			'billing-alert-email': { type: 'string' },
			'staging-budget-usd': { type: 'string' },
			'production-budget-usd': { type: 'string' },
			'github-token': { type: 'string' },
			'postgres-admin-password': { type: 'string' },
			'cloudflare-origin-hostname': { type: 'string' },
			'cloudflare-api-token': { type: 'string' },
			'stack-timeout-minutes': { type: 'string' },
			'stack-retries': { type: 'string' },
		},
	})

	if (values.help) {
		printUsage()
		return
	}

	const command = parseCommand(positionals[0])
	const currentFilePath = fileURLToPath(import.meta.url)
	const infraDir = resolve(dirname(currentFilePath), '..')
	const check = values.check ?? false
	const nonInteractive = values.nonInteractive ?? false
	setAwsNonInteractiveMode(nonInteractive)

	const profile = resolveProfile(values.profile)
	const region =
		values.region ??
		process.env.AWS_REGION ??
		process.env.AWS_DEFAULT_REGION ??
		DEFAULT_REGION
	const org = values.org ?? process.env.PULUMI_ORG ?? runPulumiWhoAmI()
	const projectTarget = parseProjectTarget(values.project)
	const environmentTarget = parseEnvironmentTarget(values.environment)
	const preview = values.preview
	const dryRun = (values.dryRun ?? false) || check
	const removeStacks = values['remove-stacks']
	const assumeRoleName = values['assume-role-name'] ?? DEFAULT_ASSUME_ROLE_NAME
	const identityAssumeRoleNameOverride = values['identity-assume-role-name']
	const ciCdRoleName = values['cicd-role-name'] ?? DEFAULT_CICD_ROLE_NAME
	const requestedAccounts =
		values['requested-accounts'] ?? DEFAULT_REQUESTED_ACCOUNTS
	const createMissingGroups = values['create-missing-groups'] ?? true
	const repo = values.repo ?? DEFAULT_REPO
	const deployerTrustedPrincipalArn = values['deployer-trusted-principal-arn']
	const billingAlertEmail =
		values['billing-alert-email'] ?? DEFAULT_BILLING_ALERT_EMAIL
	const stagingBudgetUsd =
		values['staging-budget-usd'] ?? DEFAULT_STAGING_BUDGET_USD
	const productionBudgetUsd =
		values['production-budget-usd'] ?? DEFAULT_PRODUCTION_BUDGET_USD
	const githubTokenInput = values['github-token'] ?? process.env.GITHUB_TOKEN
	const postgresPasswordInput =
		values['postgres-admin-password'] ?? process.env.POSTGRES_ADMIN_PASSWORD
	const cloudflareOriginHostname =
		values['cloudflare-origin-hostname'] ?? DEFAULT_CLOUDFLARE_ORIGIN_HOSTNAME
	const stackTimeoutMinutesInput = values['stack-timeout-minutes']
	const stackRetriesInput = values['stack-retries']
	const cloudflareApiTokenInput =
		values['cloudflare-api-token'] ??
		process.env.CLOUDFLARE_API_TOKEN ??
		process.env.CLOUDFLARE_TOKEN
	const stackOperationTimeoutMinutes = stackTimeoutMinutesInput
		? Number.parseInt(stackTimeoutMinutesInput, 10)
		: DEFAULT_STACK_OPERATION_TIMEOUT_MINUTES
	const stackOperationRetries = stackRetriesInput
		? Number.parseInt(stackRetriesInput, 10)
		: DEFAULT_STACK_OPERATION_RETRIES
	const cloudflareEmailInput = process.env.CLOUDFLARE_EMAIL
	const cloudflareApiKeyInput = process.env.CLOUDFLARE_API_KEY
	const hasCloudflareApiToken = Boolean(cloudflareApiTokenInput)
	const hasCloudflareGlobalKey = Boolean(
		cloudflareEmailInput && cloudflareApiKeyInput,
	)

	if (command !== 'destroy' && removeStacks) {
		throw new Error('--remove-stacks is only valid with the destroy command.')
	}

	if (dryRun && preview) {
		throw new Error('Dry run cannot be combined with --preview.')
	}

	if (
		!Number.isFinite(stackOperationTimeoutMinutes) ||
		stackOperationTimeoutMinutes <= 0
	) {
		throw new Error('--stack-timeout-minutes must be a positive integer.')
	}

	if (!Number.isFinite(stackOperationRetries) || stackOperationRetries < 0) {
		throw new Error('--stack-retries must be a non-negative integer.')
	}

	const stackOperationTimeoutMs = stackOperationTimeoutMinutes * 60 * 1_000

	const managementAccountName =
		values['management-account-name'] ?? DEFAULT_MANAGEMENT_ACCOUNT_NAME
	const stagingAccountName =
		values['staging-account-name'] ?? DEFAULT_STAGING_ACCOUNT_NAME
	const productionAccountName =
		values['production-account-name'] ?? DEFAULT_PRODUCTION_ACCOUNT_NAME
	const adminsGroupName =
		values['admins-group-name'] ?? DEFAULT_ADMINS_GROUP_NAME
	const developersGroupName =
		values['developers-group-name'] ?? DEFAULT_DEVELOPERS_GROUP_NAME
	const readonlyGroupName =
		values['readonly-group-name'] ?? DEFAULT_READONLY_GROUP_NAME
	const providedOrganizationSelection =
		parseJsonOption<BootstrapOrganizationSelection>(
			values['organization-topology'],
			'--organization-topology',
		)
	const providedInventory = parseJsonOption<OrganizationInventory>(
		values['organization-inventory'],
		'--organization-inventory',
	)

	console.log('Bootstrap preflight:')
	console.log(`- profile: ${profile}`)
	console.log(`- region: ${region}`)
	console.log(`- pulumi org: ${org}`)
	console.log(`- mode: ${nonInteractive ? 'non-interactive' : 'interactive'}`)

	const caller = getCallerIdentity(profile)
	if (caller.Arn.endsWith(':root')) {
		throw new Error(
			`Refusing to continue with root credentials (${caller.Arn}). Use IAM Identity Center or an IAM role session.`,
		)
	}

	const accounts = listOrganizationAccounts(profile)
	const organizationSelection =
		providedOrganizationSelection ??
		buildDefaultOrganizationSelection({
			managementAccountName,
			stagingAccountName,
			productionAccountName,
		})
	const managementAccount = resolveSelectedOrganizationAccount(
		accounts,
		organizationSelection.management,
	)
	if (caller.Account !== managementAccount.Id) {
		throw new Error(
			`Resolved caller account (${caller.Account}) does not match management account '${managementAccount.Name}' (${managementAccount.Id}). Re-authenticate with the management account profile or override --management-account-name.`,
		)
	}
	const stagingAccount = resolveSelectedOrganizationAccount(
		accounts,
		organizationSelection.staging,
	)
	const productionAccount = resolveSelectedOrganizationAccount(
		accounts,
		organizationSelection.production,
	)

	const ssoInstance = getSsoInstance(profile)
	const groups = listIdentityStoreGroups(ssoInstance.IdentityStoreId, profile)
	const adminsGroup = getOrCreateIdentityGroup(
		groups,
		adminsGroupName,
		ssoInstance.IdentityStoreId,
		profile,
		createMissingGroups,
		dryRun,
	)
	const developersGroup = getOrCreateIdentityGroup(
		groups,
		developersGroupName,
		ssoInstance.IdentityStoreId,
		profile,
		createMissingGroups,
		dryRun,
	)
	const readOnlyGroup = getOrCreateIdentityGroup(
		groups,
		readonlyGroupName,
		ssoInstance.IdentityStoreId,
		profile,
		createMissingGroups,
		dryRun,
	)

	const generatedPostgresPassword = randomBytes(24).toString('base64url')
	const githubToken = githubTokenInput ?? 'bootstrap-placeholder-token'
	const postgresAdminPassword =
		postgresPasswordInput ?? generatedPostgresPassword

	const managementAccountId = managementAccount.Id
	const stagingAccountId = stagingAccount.Id
	const productionAccountId = productionAccount.Id
	const organizationInventory =
		providedInventory ??
		loadOrganizationInventory({
			infraDir,
			profile,
			region,
		})
	const organizationImportsConfig = buildOrganizationImportsConfig({
		inventory: organizationInventory,
		managementAccountId,
		stagingAccountId,
		productionAccountId,
	})
	const stagingAssumeRoleName = resolveAssumeRoleNameForAccount(
		stagingAccountId,
		stagingAccount.Name,
		assumeRoleName,
		profile,
	)
	const productionAssumeRoleName = resolveAssumeRoleNameForAccount(
		productionAccountId,
		productionAccount.Name,
		assumeRoleName,
		profile,
	)
	const identityAssumeRoleName =
		identityAssumeRoleNameOverride ??
		resolveManagementIdentityAssumeRoleName(
			managementAccountId,
			managementAccount.Name,
			assumeRoleName,
			profile,
		)
	const ciCdPrincipalArn = resolveCiCdPrincipalArn(
		managementAccountId,
		ciCdRoleName,
		caller.Arn,
		profile,
	)
	const trustedPrincipalArn = deployerTrustedPrincipalArn ?? caller.Arn

	const sharedKubernetesConfig = JSON.stringify({
		version: '1.35',
		instanceType: 't3.medium',
		desiredCapacity: 2,
		minSize: 2,
		maxSize: 2,
	})

	const sharedPostgresConfig = JSON.stringify({
		instanceClass: 'db.t4g.micro',
		allocatedStorage: 20,
		maxAllocatedStorage: 100,
		backupRetentionDays: 7,
		engineVersion: '16.3',
		storageType: 'gp3',
		publiclyAccessible: false,
		deletionProtection: false,
		multiAz: false,
		allowedCidrs: ['172.31.0.0/16'],
	})

	const stackDefs = buildStackDefinitions({
		infraDir,
		managementAccountId,
		stagingAccountId,
		productionAccountId,
		identityAssumeRoleName,
		stagingAssumeRoleName,
		productionAssumeRoleName,
		region,
		adminsGroupId: adminsGroup.GroupId,
		developersGroupId: developersGroup.GroupId,
		readOnlyGroupId: readOnlyGroup.GroupId,
		requestedAccounts,
		organizationImportsConfig,
		billingAlertEmail,
		stagingBudgetUsd,
		productionBudgetUsd,
		ciCdPrincipalArn,
		repo,
		trustedPrincipalArn,
		sharedKubernetesConfig,
		sharedPostgresConfig,
		cloudflareOriginHostname,
		githubToken,
		cloudflareApiTokenInput,
		cloudflareEmailInput,
		cloudflareApiKeyInput,
		postgresAdminPassword,
	})

	const selected = resolveStackSelection(
		stackDefs,
		projectTarget,
		environmentTarget,
	)

	if (selected.length === 0) {
		throw new Error(
			`No stacks matched --project ${projectTarget} and --environment ${environmentTarget}.`,
		)
	}

	const executionPlan =
		command === 'destroy'
			? sortStacksForDestroy(selected)
			: sortStacksForUp(selected)

	console.log('Resolved bootstrap plan:')
	console.log(`- command: ${command}${preview ? ' (preview)' : ''}`)
	console.log(`- pulumi org: ${org}`)
	console.log(`- profile: ${profile}`)
	console.log(`- region: ${region}`)
	console.log(`- caller arn: ${caller.Arn}`)
	console.log(
		`- management account: ${managementAccount.Name} (${managementAccountId})`,
	)
	console.log(`- staging account: ${stagingAccount.Name} (${stagingAccountId})`)
	console.log(
		`- production account: ${productionAccount.Name} (${productionAccountId})`,
	)
	console.log(`- identity store id: ${ssoInstance.IdentityStoreId}`)
	console.log(`- admins group id: ${adminsGroup.GroupId}`)
	console.log(`- developers group id: ${developersGroup.GroupId}`)
	console.log(`- readonly group id: ${readOnlyGroup.GroupId}`)
	console.log(`- requested accounts json: ${requestedAccounts}`)
	console.log(`- identity assume role: ${identityAssumeRoleName}`)
	console.log(`- staging assume role: ${stagingAssumeRoleName}`)
	console.log(`- production assume role: ${productionAssumeRoleName}`)
	console.log(`- repo: ${repo}`)
	console.log(`- trusted principal arn: ${trustedPrincipalArn}`)
	console.log(`- stack timeout: ${stackOperationTimeoutMinutes} minute(s)`)
	console.log(`- stack retries: ${stackOperationRetries}`)

	if (includesPlatform(executionPlan)) {
		if (!githubTokenInput) {
			console.log(
				'- github token: missing, using generated placeholder for bootstrap (set --github-token for production use)',
			)
		} else {
			console.log('- github token: provided')
		}

		if (!postgresPasswordInput) {
			console.log(
				'- postgres admin password: missing, generated one-time password for bootstrap',
			)
		} else {
			console.log('- postgres admin password: provided')
		}

		console.log(`- cloudflare origin hostname: ${cloudflareOriginHostname}`)
		console.log(
			`- cloudflare auth mode: ${
				hasCloudflareApiToken
					? 'api token'
					: hasCloudflareGlobalKey
						? 'global key'
						: 'using existing stack config'
			}`,
		)
	}

	console.log('- execution order:')
	for (const stack of executionPlan) {
		console.log(`  - ${formatStackLabel(stack, org)}`)
	}

	if (dryRun) {
		if (check) {
			console.log(
				'Check mode enabled. Preflight completed; no Pulumi operations were run.',
			)
			return
		}

		console.log('Dry run enabled. Skipping all Pulumi operations.')
		return
	}

	const dockerConfigDir = includesPlatform(executionPlan)
		? createEphemeralDockerConfig()
		: undefined

	try {
		for (const stack of executionPlan) {
			if (command === 'destroy') {
				await destroyOrPreviewDestroyStack(
					org,
					stack,
					preview,
					removeStacks,
					profile,
					region,
					stackOperationTimeoutMs,
					stackOperationRetries,
					dockerConfigDir,
				)
				continue
			}

			await upOrPreviewStack(
				org,
				stack,
				preview,
				profile,
				region,
				stackOperationTimeoutMs,
				stackOperationRetries,
				dockerConfigDir,
			)
		}
	} finally {
		if (dockerConfigDir) {
			rmSync(dockerConfigDir, { force: true, recursive: true })
		}
	}

	console.log('Bootstrap complete.')
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error)
	console.error(`Bootstrap failed: ${message}`)
	process.exit(1)
})
