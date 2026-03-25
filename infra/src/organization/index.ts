import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import { createRequestedAccounts } from './src/account-factory.ts'
import { loadOrganizationConfig } from './src/config.ts'
import { createIdentityCenterAccess } from './src/identity.ts'

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
	requestedAccounts,
	importedAccounts,
	importedPolicies,
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

const liveOrganization = aws.organizations.getOrganizationOutput(
	{},
	{ provider: managementProvider },
)
const root = liveOrganization.roots.apply((roots) => {
	const discoveredRoot = roots[0]
	if (!discoveredRoot) {
		throw new Error(
			'No AWS Organizations root found in the current organization.',
		)
	}

	return discoveredRoot
})
const rootId = root.apply((value) => value.id)

const securityOu = new aws.organizations.OrganizationalUnit(
	'ou-security',
	{
		name: 'Security',
		parentId: rootId,
		tags: organizationTags('Security'),
	},
	{ provider: managementProvider },
)

const workloadsOu = new aws.organizations.OrganizationalUnit(
	'ou-workloads',
	{
		name: 'Workloads',
		parentId: rootId,
		tags: organizationTags('Workloads'),
	},
	{ provider: managementProvider },
)

const workloadsStagingOu = new aws.organizations.OrganizationalUnit(
	'ou-workloads-staging',
	{
		name: 'Staging',
		parentId: workloadsOu.id,
		tags: organizationTags('Workloads/Staging'),
	},
	{ provider: managementProvider },
)

const workloadsProductionOu = new aws.organizations.OrganizationalUnit(
	'ou-workloads-production',
	{
		name: 'Production',
		parentId: workloadsOu.id,
		tags: organizationTags('Workloads/Production'),
	},
	{ provider: managementProvider },
)

const organizationalUnits = {
	security: securityOu,
	workloads: workloadsOu,
	'workloads-staging': workloadsStagingOu,
	'workloads-production': workloadsProductionOu,
} as const

const stagingAccount = aws.organizations.Account.get(
	'account-staging',
	stagingAccountId,
	undefined,
	{ provider: managementProvider },
)

const productionAccount = aws.organizations.Account.get(
	'account-production',
	productionAccountId,
	undefined,
	{ provider: managementProvider },
)

const managedImportedAccounts = Object.fromEntries(
	importedAccounts.map((account) => [
		account.key,
		aws.organizations.Account.get(
			`account-${account.key}`,
			account.id,
			undefined,
			{ provider: managementProvider },
		),
	]),
)

const importedPoliciesByKey = Object.fromEntries(
	importedPolicies.map((policy) => [
		policy.key,
		aws.organizations.Policy.get(`scp-${policy.key}`, policy.id, undefined, {
			provider: managementProvider,
		}),
	]),
)

for (const policy of importedPolicies) {
	if (!policy.attachToKey) {
		continue
	}

	const importedPolicy = importedPoliciesByKey[policy.key]
	if (!importedPolicy) {
		throw new Error(`Missing imported policy '${policy.key}'.`)
	}

	const target = organizationalUnits[policy.attachToKey]
	new aws.organizations.PolicyAttachment(
		`scp-${policy.key}-attachment-ou:${policy.attachToKey}`,
		{
			policyId: importedPolicy.id,
			targetId: target.id,
		},
		{ provider: managementProvider },
	)
}

const createdAccounts = createRequestedAccounts(requestedAccounts)

export const organization = {
	organizationId: liveOrganization.id,
	rootId,
	managementAccountId,
	stagingAccountId,
	productionAccountId,
}

export { identity }

export const topologyOutputs = {
	organizationalUnits: {
		security: describeOrganizationalUnit(securityOu, rootId, 'Security'),
		workloads: describeOrganizationalUnit(workloadsOu, rootId, 'Workloads'),
		'workloads-staging': describeOrganizationalUnit(
			workloadsStagingOu,
			workloadsOu.id,
			'Workloads/Staging',
		),
		'workloads-production': describeOrganizationalUnit(
			workloadsProductionOu,
			workloadsOu.id,
			'Workloads/Production',
		),
	},
	organizationalUnitIds: {
		security: securityOu.id,
		workloads: workloadsOu.id,
		'workloads-staging': workloadsStagingOu.id,
		'workloads-production': workloadsProductionOu.id,
	},
	organizationalUnitPaths: {
		security: pulumi.output('Security'),
		workloads: pulumi.output('Workloads'),
		'workloads-staging': pulumi.output('Workloads/Staging'),
		'workloads-production': pulumi.output('Workloads/Production'),
	},
	accountIds: {
		management: pulumi.output(managementAccountId),
		staging: stagingAccount.id,
		production: productionAccount.id,
		...Object.fromEntries(
			Object.entries(managedImportedAccounts).map(([key, account]) => [
				key,
				account.id,
			]),
		),
	},
	controlTowerGovernedOuKeys: ['workloads-staging', 'workloads-production'],
}

export const serviceControlPolicies = {
	configuredPolicyCount: importedPolicies.length,
	policies: Object.fromEntries(
		Object.entries(importedPoliciesByKey).map(([key, policy]) => [
			key,
			{
				id: policy.id,
				arn: policy.arn,
				name: policy.name,
				type: policy.type,
			},
		]),
	),
}

export const controltowerOutputs = {
	configuredRegion: region,
	requestedAccountCount: requestedAccounts.length,
	createdAccountIds: createdAccounts.map((account) => account.accountId),
}

function organizationTags(path: string) {
	return {
		ManagedBy: 'Pulumi',
		Project: 'aamini-stack',
		Scope: 'organization-topology',
		Path: path,
	}
}

function describeOrganizationalUnit(
	resource: aws.organizations.OrganizationalUnit,
	parentId: pulumi.Input<string>,
	path: string,
) {
	return pulumi
		.all([resource.id, resource.arn, pulumi.output(parentId)])
		.apply(([id, arn, resolvedParentId]) => ({
			id,
			arn,
			name: resource.name,
			path,
			parentId: resolvedParentId,
		}))
}
