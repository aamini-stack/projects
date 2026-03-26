import * as pulumi from '@pulumi/pulumi'

export type RequestedAccount = {
	name: string
	email: string
	organizationalUnit: string
	ssoFirstName: string
	ssoLastName: string
	ssoEmail: string
	organizationalUnitIdOnDelete: string
	closeAccountOnDelete: boolean
	provisionedProductName: string
	pathId: string
	tags: Record<string, string>
}

export type ImportedAccount = {
	key: string
	name: string
	id: string
	parentKey: 'root' | 'infrastructure' | 'workloads'
}

export type ImportedPolicy = {
	key: string
	name: string
	id: string
	attachToKey?: 'infrastructure' | 'workloads'
}

export type ManagedAccountEnvironment = 'staging' | 'production'

export type ManagedAccountConfig = {
	accountId: string
	assumeRoleName: string
}

export type OrganizationConfig = {
	region: string
	managementAccountId: string
}

export type IdentityConfig = {
	assumeRoleName: string
	requiredCallerRoleFragment?: string
	adminsGroupId: string
	operatorsGroupId?: string
	developersGroupId: string
	readOnlyGroupId: string
}

export type AccountsConfig = {
	staging: ManagedAccountConfig
	production: ManagedAccountConfig
	requested: RequestedAccount[]
}

export type GuardrailsAccountConfig = ManagedAccountConfig & {
	environment: ManagedAccountEnvironment
	budgetLimitUsd: number
	deploymentPrincipalPatterns: string[]
}

export type GuardrailsConfig = {
	billingAlertEmail: string | undefined
	ciCdPrincipalArn: string
	deploymentPrincipalPatterns: string[]
	staging: GuardrailsAccountConfig
	production: GuardrailsAccountConfig
}

export type OrganizationStackConfig = {
	organization: OrganizationConfig
	identity: IdentityConfig
	accounts: AccountsConfig
	guardrails: GuardrailsConfig
}

const DEFAULT_REGION = 'us-east-1'
const DEFAULT_ASSUME_ROLE_NAME = 'AWSControlTowerExecution'
const DEFAULT_STAGING_BUDGET_USD = 150
const DEFAULT_PRODUCTION_BUDGET_USD = 500

export function loadOrganizationConfig(): OrganizationStackConfig {
	const config = new pulumi.Config()
	const groupedOrganization =
		config.getObject<Partial<OrganizationConfig>>('organization')
	const groupedIdentity = config.getObject<Partial<IdentityConfig>>('identity')
	const groupedAccounts = config.getObject<
		Partial<{
			staging: Partial<ManagedAccountConfig>
			production: Partial<ManagedAccountConfig>
			requested: RequestedAccount[]
		}>
	>('accounts')
	const groupedGuardrails = config.getObject<
		Partial<{
			billingAlertEmail?: string
			ciCdPrincipalArn: string
			deploymentPrincipalPatterns: string[]
			staging: Partial<
				Pick<
					GuardrailsAccountConfig,
					'budgetLimitUsd' | 'deploymentPrincipalPatterns'
				>
			>
			production: Partial<
				Pick<
					GuardrailsAccountConfig,
					'budgetLimitUsd' | 'deploymentPrincipalPatterns'
				>
			>
		}>
	>('guardrails')
	const region =
		groupedOrganization?.region ?? config.get('region') ?? DEFAULT_REGION
	const managementAccountId =
		groupedOrganization?.managementAccountId ??
		config.require('managementAccountId')
	const stagingAccountId =
		groupedAccounts?.staging?.accountId ?? config.require('stagingAccountId')
	const productionAccountId =
		groupedAccounts?.production?.accountId ??
		config.require('productionAccountId')
	const stagingAssumeRoleName =
		groupedAccounts?.staging?.assumeRoleName ??
		config.get('stagingAssumeRoleName') ??
		DEFAULT_ASSUME_ROLE_NAME
	const productionAssumeRoleName =
		groupedAccounts?.production?.assumeRoleName ??
		config.get('productionAssumeRoleName') ??
		DEFAULT_ASSUME_ROLE_NAME
	const identityAssumeRoleName =
		groupedIdentity?.assumeRoleName ??
		config.get('identityAssumeRoleName') ??
		'none'
	const requiredCallerRoleFragment =
		groupedIdentity?.requiredCallerRoleFragment ??
		config.get('requiredCallerRoleFragment') ??
		undefined
	const adminsGroupId =
		groupedIdentity?.adminsGroupId ?? config.require('adminsGroupId')
	const operatorsGroupId =
		groupedIdentity?.operatorsGroupId ??
		config.get('operatorsGroupId') ??
		undefined
	const developersGroupId =
		groupedIdentity?.developersGroupId ?? config.require('developersGroupId')
	const readOnlyGroupId =
		groupedIdentity?.readOnlyGroupId ?? config.require('readOnlyGroupId')
	const requestedAccounts =
		groupedAccounts?.requested ??
		config.getObject<RequestedAccount[]>('requestedAccounts') ??
		[]
	const billingAlertEmail =
		groupedGuardrails?.billingAlertEmail ?? config.get('billingAlertEmail')
	const ciCdPrincipalArn =
		groupedGuardrails?.ciCdPrincipalArn ?? config.require('ciCdPrincipalArn')
	const deploymentPrincipalPatterns =
		groupedGuardrails?.deploymentPrincipalPatterns ??
		config.getObject<string[]>('deploymentPrincipalPatterns') ??
		[]
	const stagingDeploymentPrincipalPatterns =
		groupedGuardrails?.staging?.deploymentPrincipalPatterns ??
		config.getObject<string[]>('stagingDeploymentPrincipalPatterns') ??
		deploymentPrincipalPatterns
	const productionDeploymentPrincipalPatterns =
		groupedGuardrails?.production?.deploymentPrincipalPatterns ??
		config.getObject<string[]>('productionDeploymentPrincipalPatterns') ??
		deploymentPrincipalPatterns
	const stagingBudgetLimitUsd =
		groupedGuardrails?.staging?.budgetLimitUsd ??
		config.getNumber('stagingBudgetLimitUsd') ??
		DEFAULT_STAGING_BUDGET_USD
	const productionBudgetLimitUsd =
		groupedGuardrails?.production?.budgetLimitUsd ??
		config.getNumber('productionBudgetLimitUsd') ??
		DEFAULT_PRODUCTION_BUDGET_USD

	return {
		organization: {
			region,
			managementAccountId,
		},
		identity: {
			assumeRoleName: identityAssumeRoleName,
			...(requiredCallerRoleFragment ? { requiredCallerRoleFragment } : {}),
			adminsGroupId,
			...(operatorsGroupId ? { operatorsGroupId } : {}),
			developersGroupId,
			readOnlyGroupId,
		},
		accounts: {
			staging: {
				accountId: stagingAccountId,
				assumeRoleName: stagingAssumeRoleName,
			},
			production: {
				accountId: productionAccountId,
				assumeRoleName: productionAssumeRoleName,
			},
			requested: requestedAccounts,
		},
		guardrails: {
			billingAlertEmail,
			ciCdPrincipalArn,
			deploymentPrincipalPatterns,
			staging: {
				environment: 'staging',
				accountId: stagingAccountId,
				assumeRoleName: stagingAssumeRoleName,
				budgetLimitUsd: stagingBudgetLimitUsd,
				deploymentPrincipalPatterns: stagingDeploymentPrincipalPatterns,
			},
			production: {
				environment: 'production',
				accountId: productionAccountId,
				assumeRoleName: productionAssumeRoleName,
				budgetLimitUsd: productionBudgetLimitUsd,
				deploymentPrincipalPatterns: productionDeploymentPrincipalPatterns,
			},
		},
	}
}
