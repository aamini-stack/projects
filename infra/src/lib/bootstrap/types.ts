import type {
	AwsAccount,
	CallerIdentity,
	IdentityGroup,
	SsoInstance,
} from '../aws/types.ts'

export type BootstrapAccountSelection = {
	name: string
	id?: string
}

export type BootstrapOrganizationSelection = {
	management: BootstrapAccountSelection
	staging: BootstrapAccountSelection
	production: BootstrapAccountSelection
}

export type StackProject = 'organization' | 'platform'
export type StackEnvironment = 'global' | 'staging' | 'production'
export type ProjectTarget = StackProject | 'all'
export type EnvironmentTarget = StackEnvironment | 'all'
export type Command = 'up' | 'destroy'
export type StackOperation = 'preview' | 'up' | 'preview-destroy' | 'destroy'

export type StackDefinition = {
	key: string
	project: StackProject
	environment: StackEnvironment
	workDir: string
	stack: string
	config: Record<string, { value: string; secret?: boolean }>
}

export type BootstrapOptions = {
	command: Command
	check: boolean
	nonInteractive: boolean
	org: string | undefined
	profile: string | undefined
	region: string | undefined
	preview: boolean
	dryRun: boolean
	projectTarget: ProjectTarget
	environmentTarget: EnvironmentTarget
	removeStacks: boolean
}

export type BootstrapContext = {
	infraDir: string
	command: Command
	check: boolean
	nonInteractive: boolean
	org: string
	profile: string
	region: string
	preview: boolean
	dryRun: boolean
	projectTarget: ProjectTarget
	environmentTarget: EnvironmentTarget
	removeStacks: boolean
	assumeRoleName: string
	ciCdRoleName: string
	requestedAccounts: string
	managementAccountName: string
	stagingAccountName: string
	productionAccountName: string
	adminsGroupName: string
	developersGroupName: string
	readonlyGroupName: string
	createMissingGroups: boolean
	repo: string
	deployerTrustedPrincipalArn: string | undefined
	billingAlertEmail: string
	stagingBudgetUsd: string
	productionBudgetUsd: string
	githubTokenInput: string | undefined
	postgresPasswordInput: string | undefined
	cloudflareOriginHostname: string
	cloudflareApiTokenInput: string | undefined
	cloudflareEmailInput: string | undefined
	cloudflareApiKeyInput: string | undefined
	stackOperationTimeoutMinutes: number
	stackOperationTimeoutMs: number
	stackOperationRetries: number
	hasCloudflareApiToken: boolean
	hasCloudflareGlobalKey: boolean
	caller: CallerIdentity
	accounts: AwsAccount[]
	organizationSelection: BootstrapOrganizationSelection
	managementAccount: AwsAccount
	stagingAccount: AwsAccount
	productionAccount: AwsAccount
	ssoInstance: SsoInstance
	adminsGroup: IdentityGroup
	developersGroup: IdentityGroup
	readOnlyGroup: IdentityGroup
	identityAssumeRoleName: string
	stagingAssumeRoleName: string
	productionAssumeRoleName: string
	ciCdPrincipalArn: string
	trustedPrincipalArn: string
	sharedKubernetesConfig: string
	sharedPostgresConfig: string
	githubToken: string
	postgresAdminPassword: string
}

export type BootstrapPlan = {
	context: BootstrapContext
	selectedStacks: StackDefinition[]
	executionPlan: StackDefinition[]
}
