import * as aws from '@pulumi/aws'
import { createRequestedAccounts } from './src/account-factory.ts'
import { loadOrganizationConfig } from './src/config.ts'
import { createIdentityCenterAccess } from './src/identity.ts'
import { createServiceControlPolicies } from './src/scp.ts'
import { createOrganizationTopology } from './src/topology.ts'

const config = loadOrganizationConfig()

const {
	region,
	managementAccountId,
	stagingAccountId,
	productionAccountId,
	identityAssumeRoleName,
	adminsGroupId,
	developersGroupId,
	readOnlyGroupId,
	inventory,
	topology,
} = config

const managementProviderArgs: aws.ProviderArgs = { region }
if (identityAssumeRoleName !== 'none') {
	managementProviderArgs.assumeRoles = [
		{
			roleArn: `arn:aws:iam::${managementAccountId}:role/${identityAssumeRoleName}`,
			sessionName: 'pulumi-organization-identity',
		},
	]
}

const managementProvider = new aws.Provider(
	'management',
	managementProviderArgs,
)

const identityCenterInstances = aws.ssoadmin.getInstancesOutput(
	{},
	{ provider: managementProvider },
)
const identityCenterArn = identityCenterInstances.arns.apply((arns) => {
	const arn = arns[0]
	if (!arn) {
		throw new Error(
			'No IAM Identity Center instance found in this organization',
		)
	}

	return arn
})

const identity = createIdentityCenterAccess({
	provider: managementProvider,
	identityCenterArn,
	adminsGroupId,
	developersGroupId,
	readOnlyGroupId,
	stagingAccountId,
	productionAccountId,
	managementAccountId,
})

const organizationTopology = createOrganizationTopology({
	provider: managementProvider,
	topology,
	inventory,
	managementAccountId,
})

const configuredServiceControlPolicies = createServiceControlPolicies({
	provider: managementProvider,
	topology,
	targetIds: organizationTopology.accountTargetIds,
})

const createdAccounts = createRequestedAccounts(topology.requestedAccounts)

export const organization = {
	organizationId: organizationTopology.organizationId,
	rootId: organizationTopology.rootId,
	managementAccountId,
	stagingAccountId,
	productionAccountId,
}

export { identity }

export const topologyOutputs = {
	organizationalUnits: organizationTopology.organizationalUnits,
	organizationalUnitIds: organizationTopology.organizationalUnitIds,
	organizationalUnitPaths: organizationTopology.organizationalUnitPaths,
	accountIds: organizationTopology.accountIds,
	accountCurrentParentIds: organizationTopology.accountCurrentParentIds,
	accountDesiredParentIds: organizationTopology.accountDesiredParentIds,
	accountPlacement: organizationTopology.accountPlacement,
	controlTowerGovernedOuKeys: topology.controlTowerGovernedOuKeys,
}

export const serviceControlPolicies = configuredServiceControlPolicies

export const controltowerOutputs = {
	configuredRegion: region,
	requestedAccountCount: topology.requestedAccounts.length,
	createdAccountIds: createdAccounts.map((account) => account.accountId),
}
