import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import {
	accountById,
	accountByName,
	getCallerIdentity,
	getOrCreateIdentityGroup,
	getSsoInstance,
	listIdentityStoreGroups,
	listOrganizationAccounts,
	resolveCiCdPrincipalArn,
	resolveAssumeRoleNameForAccount,
	resolveManagementIdentityAssumeRoleName,
	setAwsNonInteractiveMode,
	type AwsAccount,
} from '../aws.ts'
import { execText } from '../runtime.ts'
import type {
	BootstrapAccountSelection,
	BootstrapContext,
	BootstrapOptions,
	BootstrapOrganizationSelection,
} from './types.ts'

const DEFAULT_REGION = 'us-east-1'
const DEFAULT_ASSUME_ROLE_NAME = 'AWSControlTowerExecution'
const DEFAULT_CICD_ROLE_NAME = 'PulumiOperatorRole'
const DEFAULT_REQUESTED_ACCOUNTS = '[]'
const DEFAULT_MANAGEMENT_ACCOUNT_NAME = 'aamini-root'
const DEFAULT_STAGING_ACCOUNT_NAME = 'aamini-staging'
const DEFAULT_PRODUCTION_ACCOUNT_NAME = 'aamini-production'
const DEFAULT_ADMINS_GROUP_NAME = 'Admins'
const DEFAULT_DEVELOPERS_GROUP_NAME = 'Developers'
const DEFAULT_READONLY_GROUP_NAME = 'ReadOnly'
const DEFAULT_REPO = 'aamini-stack/projects'
const DEFAULT_BILLING_ALERT_EMAIL = 'platform-alerts@example.com'
const DEFAULT_STAGING_BUDGET_USD = '150'
const DEFAULT_PRODUCTION_BUDGET_USD = '500'
const DEFAULT_CLOUDFLARE_ORIGIN_HOSTNAME = 'origin.ariaamini.com'
const DEFAULT_STACK_OPERATION_TIMEOUT_MINUTES = 45
const DEFAULT_STACK_OPERATION_RETRIES = 2

function runPulumiWhoAmI(): string {
	return execText({
		cmd: 'pulumi',
		args: ['whoami'],
	}).trim()
}

function resolveProfile(cliProfile: string | undefined): string {
	const profile =
		cliProfile ?? process.env.AWS_PROFILE ?? process.env.AWS_DEFAULT_PROFILE

	if (!profile) {
		throw new Error(
			'No AWS profile resolved. Pass --profile or set AWS_PROFILE/AWS_DEFAULT_PROFILE.',
		)
	}

	return profile
}

function buildDefaultOrganizationSelection(input: {
	managementAccountName: string
	stagingAccountName: string
	productionAccountName: string
}): BootstrapOrganizationSelection {
	return {
		management: { name: input.managementAccountName },
		staging: { name: input.stagingAccountName },
		production: { name: input.productionAccountName },
	}
}

function resolveSelectedOrganizationAccount(
	accounts: AwsAccount[],
	requested: BootstrapAccountSelection,
): AwsAccount {
	if (requested.id) {
		const account = accountById(accounts, requested.id)
		if (account.Name !== requested.name) {
			throw new Error(
				`Explicit organization account '${requested.name}' expected id ${requested.id}, but AWS returned '${account.Name}'.`,
			)
		}

		return account
	}

	return accountByName(accounts, requested.name)
}

export async function resolveBootstrapContext(
	options: BootstrapOptions,
): Promise<BootstrapContext> {
	setAwsNonInteractiveMode(options.nonInteractive)

	const currentFilePath = fileURLToPath(import.meta.url)
	const infraDir = resolve(dirname(currentFilePath), '..', '..')
	const profile = resolveProfile(options.profile)
	const region =
		options.region ??
		process.env.AWS_REGION ??
		process.env.AWS_DEFAULT_REGION ??
		DEFAULT_REGION
	const org = options.org ?? process.env.PULUMI_ORG ?? runPulumiWhoAmI()
	const assumeRoleName = DEFAULT_ASSUME_ROLE_NAME
	const ciCdRoleName = DEFAULT_CICD_ROLE_NAME
	const requestedAccounts = DEFAULT_REQUESTED_ACCOUNTS
	const managementAccountName = DEFAULT_MANAGEMENT_ACCOUNT_NAME
	const stagingAccountName = DEFAULT_STAGING_ACCOUNT_NAME
	const productionAccountName = DEFAULT_PRODUCTION_ACCOUNT_NAME
	const adminsGroupName = DEFAULT_ADMINS_GROUP_NAME
	const developersGroupName = DEFAULT_DEVELOPERS_GROUP_NAME
	const readonlyGroupName = DEFAULT_READONLY_GROUP_NAME
	const createMissingGroups = true
	const repo = DEFAULT_REPO
	const deployerTrustedPrincipalArn = undefined
	const billingAlertEmail = DEFAULT_BILLING_ALERT_EMAIL
	const stagingBudgetUsd = DEFAULT_STAGING_BUDGET_USD
	const productionBudgetUsd = DEFAULT_PRODUCTION_BUDGET_USD
	const githubTokenInput = process.env.GITHUB_TOKEN
	const postgresPasswordInput = process.env.POSTGRES_ADMIN_PASSWORD
	const cloudflareOriginHostname = DEFAULT_CLOUDFLARE_ORIGIN_HOSTNAME
	const cloudflareApiTokenInput =
		process.env.CLOUDFLARE_API_TOKEN ?? process.env.CLOUDFLARE_TOKEN
	const cloudflareEmailInput = process.env.CLOUDFLARE_EMAIL
	const cloudflareApiKeyInput = process.env.CLOUDFLARE_API_KEY
	const stackOperationTimeoutMinutes = DEFAULT_STACK_OPERATION_TIMEOUT_MINUTES
	const stackOperationTimeoutMs = stackOperationTimeoutMinutes * 60 * 1_000
	const stackOperationRetries = DEFAULT_STACK_OPERATION_RETRIES
	const hasCloudflareApiToken = Boolean(cloudflareApiTokenInput)
	const hasCloudflareGlobalKey = Boolean(
		cloudflareEmailInput && cloudflareApiKeyInput,
	)

	const caller = getCallerIdentity({ profile, region })
	if (caller.Arn.endsWith(':root')) {
		throw new Error(
			`Refusing to continue with root credentials (${caller.Arn}). Use IAM Identity Center or an IAM role session.`,
		)
	}

	const accounts = listOrganizationAccounts({ profile, region })
	const organizationSelection = buildDefaultOrganizationSelection({
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
			`Resolved caller account (${caller.Account}) does not match management account '${managementAccount.Name}' (${managementAccount.Id}). Re-authenticate with the management account profile.`,
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

	const ssoInstance = getSsoInstance(profile, region)
	const groups = listIdentityStoreGroups(
		ssoInstance.IdentityStoreId,
		profile,
		region,
	)
	const adminsGroup = getOrCreateIdentityGroup(
		groups,
		adminsGroupName,
		ssoInstance.IdentityStoreId,
		profile,
		region,
		createMissingGroups,
		options.dryRun,
	)
	const developersGroup = getOrCreateIdentityGroup(
		groups,
		developersGroupName,
		ssoInstance.IdentityStoreId,
		profile,
		region,
		createMissingGroups,
		options.dryRun,
	)
	const readOnlyGroup = getOrCreateIdentityGroup(
		groups,
		readonlyGroupName,
		ssoInstance.IdentityStoreId,
		profile,
		region,
		createMissingGroups,
		options.dryRun,
	)

	const generatedPostgresPassword = randomBytes(24).toString('base64url')
	const githubToken = githubTokenInput ?? 'bootstrap-placeholder-token'
	const postgresAdminPassword =
		postgresPasswordInput ?? generatedPostgresPassword

	const managementAccountId = managementAccount.Id
	const stagingAccountId = stagingAccount.Id
	const productionAccountId = productionAccount.Id
	const stagingAssumeRoleName = resolveAssumeRoleNameForAccount(
		stagingAccountId,
		stagingAccount.Name,
		assumeRoleName,
		profile,
		region,
	)
	const productionAssumeRoleName = resolveAssumeRoleNameForAccount(
		productionAccountId,
		productionAccount.Name,
		assumeRoleName,
		profile,
		region,
	)
	const identityAssumeRoleName = resolveManagementIdentityAssumeRoleName(
		managementAccountId,
		managementAccount.Name,
		assumeRoleName,
		profile,
		region,
	)
	const ciCdPrincipalArn = resolveCiCdPrincipalArn(
		managementAccountId,
		ciCdRoleName,
		caller.Arn,
		profile,
		region,
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

	return {
		infraDir,
		command: options.command,
		check: options.check,
		nonInteractive: options.nonInteractive,
		org,
		profile,
		region,
		preview: options.preview,
		dryRun: options.dryRun,
		projectTarget: options.projectTarget,
		environmentTarget: options.environmentTarget,
		removeStacks: options.removeStacks,
		assumeRoleName,
		ciCdRoleName,
		requestedAccounts,
		managementAccountName,
		stagingAccountName,
		productionAccountName,
		adminsGroupName,
		developersGroupName,
		readonlyGroupName,
		createMissingGroups,
		repo,
		deployerTrustedPrincipalArn,
		billingAlertEmail,
		stagingBudgetUsd,
		productionBudgetUsd,
		githubTokenInput,
		postgresPasswordInput,
		cloudflareOriginHostname,
		cloudflareApiTokenInput,
		cloudflareEmailInput,
		cloudflareApiKeyInput,
		stackOperationTimeoutMinutes,
		stackOperationTimeoutMs,
		stackOperationRetries,
		hasCloudflareApiToken,
		hasCloudflareGlobalKey,
		caller,
		accounts,
		organizationSelection,
		managementAccount,
		stagingAccount,
		productionAccount,
		ssoInstance,
		adminsGroup,
		developersGroup,
		readOnlyGroup,
		identityAssumeRoleName,
		stagingAssumeRoleName,
		productionAssumeRoleName,
		ciCdPrincipalArn,
		trustedPrincipalArn,
		sharedKubernetesConfig,
		sharedPostgresConfig,
		githubToken,
		postgresAdminPassword,
	}
}
