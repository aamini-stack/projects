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
	parentKey:
		| 'root'
		| 'security'
		| 'workloads'
		| 'workloads-staging'
		| 'workloads-production'
}

export type ImportedPolicy = {
	key: string
	name: string
	id: string
	attachToKey?:
		| 'security'
		| 'workloads'
		| 'workloads-staging'
		| 'workloads-production'
}

export type OrganizationStackConfig = {
	region: string
	managementAccountId: string
	stagingAccountId: string
	productionAccountId: string
	identityAssumeRoleName: string
	adminsGroupId: string
	developersGroupId: string
	readOnlyGroupId: string
	requestedAccounts: RequestedAccount[]
	importedAccounts: ImportedAccount[]
	importedPolicies: ImportedPolicy[]
}

const DEFAULT_REGION = 'us-east-1'

export function loadOrganizationConfig(): OrganizationStackConfig {
	const config = new pulumi.Config()
	const region = config.get('region') ?? DEFAULT_REGION
	const managementAccountId = config.require('managementAccountId')
	const stagingAccountId = config.require('stagingAccountId')
	const productionAccountId = config.require('productionAccountId')
	const identityAssumeRoleName = config.get('identityAssumeRoleName') ?? 'none'
	const adminsGroupId = config.require('adminsGroupId')
	const developersGroupId = config.require('developersGroupId')
	const readOnlyGroupId = config.require('readOnlyGroupId')
	const requestedAccounts =
		config.getObject<RequestedAccount[]>('requestedAccounts') ?? []
	const importedAccounts =
		config.getObject<ImportedAccount[]>('importedAccounts') ?? []
	const importedPolicies =
		config.getObject<ImportedPolicy[]>('importedPolicies') ?? []

	return {
		region,
		managementAccountId,
		stagingAccountId,
		productionAccountId,
		identityAssumeRoleName,
		adminsGroupId,
		developersGroupId,
		readOnlyGroupId,
		requestedAccounts,
		importedAccounts,
		importedPolicies,
	}
}
