export type AwsAccount = {
	Id: string
	Name: string
	Status: string
}

export type OrganizationInventory = {
	rootId?: string
	organizationalUnits?: Array<{
		id: string
		name: string
		parentId: string
		path?: string
	}>
	accounts?: Array<{
		id: string
		name: string
		email?: string
		parentId?: string
	}>
	policies?: Array<{
		id: string
		name: string
		targetIds?: string[]
	}>
}

export type CallerIdentity = {
	Account: string
	Arn: string
	UserId: string
}

export type SsoInstance = {
	InstanceArn: string
	IdentityStoreId: string
}

export type IdentityGroup = {
	DisplayName: string
	GroupId: string
}

export type AwsIamGetRoleResponse = {
	Role: {
		Arn: string
		RoleName: string
	}
}

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
