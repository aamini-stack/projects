import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import { createRequestedAccounts } from './account-factory.ts'
import type {
	ImportedAccount,
	ImportedPolicy,
	RequestedAccount,
} from './config.ts'

type OrganizationTopologyInput = {
	provider: aws.Provider
	managementAccountId: string
	stagingAccountId: string
	productionAccountId: string
	requestedAccounts: RequestedAccount[]
	importedAccounts: ImportedAccount[]
	importedPolicies: ImportedPolicy[]
}

export function createOrganizationTopology(input: OrganizationTopologyInput) {
	const liveOrganization = aws.organizations.getOrganizationOutput(
		{},
		{ provider: input.provider },
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

	const infrastructureOu = new aws.organizations.OrganizationalUnit(
		'ou-infrastructure',
		{
			name: 'Infrastructure',
			parentId: rootId,
			tags: organizationTags('Infrastructure'),
		},
		{ provider: input.provider },
	)

	const workloadsOu = new aws.organizations.OrganizationalUnit(
		'ou-workloads',
		{
			name: 'Workloads',
			parentId: rootId,
			tags: organizationTags('Workloads'),
		},
		{ provider: input.provider },
	)

	const organizationalUnits = {
		infrastructure: infrastructureOu,
		workloads: workloadsOu,
	} as const

	const stagingAccount = aws.organizations.getAccountOutput(
		{ accountId: input.stagingAccountId },
		{ provider: input.provider },
	)

	const productionAccount = aws.organizations.getAccountOutput(
		{ accountId: input.productionAccountId },
		{ provider: input.provider },
	)

	const managedImportedAccounts = Object.fromEntries(
		input.importedAccounts.map((account) => [
			account.key,
			aws.organizations.getAccountOutput(
				{ accountId: account.id },
				{ provider: input.provider },
			),
		]),
	)

	const importedPoliciesByKey = Object.fromEntries(
		input.importedPolicies.map((policy) => [
			policy.key,
			aws.organizations.Policy.get(`scp-${policy.key}`, policy.id, undefined, {
				provider: input.provider,
			}),
		]),
	)

	for (const policy of input.importedPolicies) {
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
			{ provider: input.provider },
		)
	}

	const createdAccounts = createRequestedAccounts(input.requestedAccounts)

	return {
		organization: {
			organizationId: liveOrganization.id,
			rootId,
			managementAccountId: input.managementAccountId,
			stagingAccountId: input.stagingAccountId,
			productionAccountId: input.productionAccountId,
		},
		organizationStructure: {
			organizationalUnits: {
				infrastructure: describeOrganizationalUnit(
					infrastructureOu,
					rootId,
					'Infrastructure',
				),
				workloads: describeOrganizationalUnit(workloadsOu, rootId, 'Workloads'),
			},
			accounts: {
				management: pulumi.output({
					id: input.managementAccountId,
					parentId: rootId,
					desiredPlacement: 'Root/Management',
				}),
				staging: stagingAccount.apply((account) => ({
					id: account.id,
					parentId: account.parentId,
					desiredPlacement: 'Workloads/Staging',
				})),
				production: productionAccount.apply((account) => ({
					id: account.id,
					parentId: account.parentId,
					desiredPlacement: 'Workloads/Production',
				})),
				...Object.fromEntries(
					Object.entries(managedImportedAccounts).map(([key, account]) => [
						key,
						account.apply((resolvedAccount) => ({
							id: resolvedAccount.id,
							parentId: resolvedAccount.parentId,
							parentKey: input.importedAccounts.find(
								(candidate) => candidate.key === key,
							)?.parentKey,
						})),
					]),
				),
			},
			controlTowerManagedOus: ['workloads'],
		},
		serviceControlPolicies: {
			configuredPolicyCount: input.importedPolicies.length,
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
		},
		controltowerOutputs: {
			configuredRegion: aws.getRegionOutput({}, { provider: input.provider })
				.name,
			requestedAccountCount: input.requestedAccounts.length,
			createdAccountIds: createdAccounts.map((account) => account.accountId),
		},
	}
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
