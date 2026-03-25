import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type {
	ExistingAccountTopology,
	OrganizationInventory,
	OrganizationTopology,
} from './config.ts'

type OrganizationalUnitRef = {
	key: string
	name: string
	path: string
	id: pulumi.Output<string>
	arn: pulumi.Output<string>
	parentId: pulumi.Input<string>
}

type ExistingAccountRef = {
	key: string
	name: string
	id: pulumi.Output<string>
	arn: pulumi.Output<string>
	currentParentId: pulumi.Input<string>
	desiredParentId: pulumi.Input<string>
	desiredParentKey: string
	managed: boolean
}

export function createOrganizationTopology(input: {
	provider: aws.Provider
	topology: OrganizationTopology
	inventory: OrganizationInventory
	managementAccountId: string
}) {
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
	const rootId = pulumi.output(
		input.inventory.rootId ?? root.apply((value) => value.id),
	)
	const organizationId = liveOrganization.id

	const unitsByKey = new Map<string, OrganizationalUnitRef>()
	for (const unit of input.topology.organizationalUnits) {
		const parentId =
			unit.parentKey === 'root'
				? rootId
				: requireOrganizationalUnit(unitsByKey, unit.parentKey).id

		const resource = new aws.organizations.OrganizationalUnit(
			`ou-${unit.key}`,
			{
				name: unit.name,
				parentId,
				tags: {
					ManagedBy: 'Pulumi',
					Project: 'aamini-stack',
					Scope: 'organization-topology',
					Path: unit.path ?? unit.name,
				},
			},
			{
				provider: input.provider,
				...(unit.importId ? { import: unit.importId } : {}),
			},
		)

		unitsByKey.set(unit.key, {
			key: unit.key,
			name: unit.name,
			path: unit.path ?? unit.name,
			id: resource.id,
			arn: resource.arn,
			parentId,
		})
	}

	const existingAccounts = new Map<string, ExistingAccountRef>()
	for (const account of input.topology.existingAccounts) {
		const desiredParentId =
			account.desiredParentKey === 'root'
				? rootId
				: requireOrganizationalUnit(unitsByKey, account.desiredParentKey).id
		const currentParentId = account.currentParentId ?? desiredParentId

		const managedAccount = createExistingAccountResource({
			account,
			currentParentId,
			desiredParentId,
			provider: input.provider,
		})

		existingAccounts.set(account.key, managedAccount)
	}

	const accountIds = Object.fromEntries([
		['management', pulumi.output(input.managementAccountId)],
		...Array.from(existingAccounts.values()).map((account) => [
			account.key,
			account.id,
		]),
	])
	const accountCurrentParentIds = Object.fromEntries(
		Array.from(existingAccounts.values()).map((account) => [
			account.key,
			pulumi.output(account.currentParentId),
		]),
	)
	const accountDesiredParentIds = Object.fromEntries(
		Array.from(existingAccounts.values()).map((account) => [
			account.key,
			pulumi.output(account.desiredParentId),
		]),
	)
	const accountPlacement = Object.fromEntries(
		Array.from(existingAccounts.values()).map((account) => [
			account.key,
			pulumi
				.all([
					account.id,
					pulumi.output(account.currentParentId),
					pulumi.output(account.desiredParentId),
				])
				.apply(([id, currentParentIdValue, desiredParentIdValue]) => ({
					id,
					currentParentId: currentParentIdValue,
					desiredParentId: desiredParentIdValue,
					desiredParentKey: account.desiredParentKey,
					managed: account.managed,
					requiresMove: currentParentIdValue !== desiredParentIdValue,
				})),
		]),
	)

	const organizationalUnits = Object.fromEntries(
		Array.from(unitsByKey.values()).map((unit) => [
			unit.key,
			pulumi
				.all([unit.id, unit.arn, pulumi.output(unit.parentId)])
				.apply(([id, arn, parentId]) => ({
					id,
					arn,
					name: unit.name,
					path: unit.path,
					parentId,
				})),
		]),
	)
	const organizationalUnitIds = Object.fromEntries(
		Array.from(unitsByKey.values()).map((unit) => [unit.key, unit.id]),
	)
	const organizationalUnitPaths = Object.fromEntries(
		Array.from(unitsByKey.values()).map((unit) => [
			unit.key,
			pulumi.output(unit.path),
		]),
	)

	return {
		organizationId,
		rootId,
		rootName: root.apply((value) => value.name),
		organizationalUnits,
		organizationalUnitIds,
		organizationalUnitPaths,
		accountIds,
		accountCurrentParentIds,
		accountDesiredParentIds,
		accountPlacement,
		accountTargetIds: {
			root: rootId,
			managementAccount: pulumi.output(input.managementAccountId),
			...Object.fromEntries(
				Array.from(unitsByKey.values()).map((unit) => [
					`ou:${unit.key}`,
					unit.id,
				]),
			),
			...Object.fromEntries(
				Array.from(existingAccounts.values()).map((account) => [
					`account:${account.key}`,
					account.id,
				]),
			),
		},
	}
}

function createExistingAccountResource(input: {
	account: ExistingAccountTopology
	currentParentId: pulumi.Input<string>
	desiredParentId: pulumi.Input<string>
	provider: aws.Provider
}): ExistingAccountRef {
	const targetParentId = input.account.adoptToDesiredParent
		? input.desiredParentId
		: input.currentParentId

	if (input.account.email) {
		const resource = new aws.organizations.Account(
			`account-${input.account.key}`,
			{
				name: input.account.name,
				email: input.account.email,
				parentId: targetParentId,
				closeOnDeletion: false,
				...(input.account.roleName ? { roleName: input.account.roleName } : {}),
				tags: {
					ManagedBy: 'Pulumi',
					Project: 'aamini-stack',
					Scope: 'organization-account-placement',
				},
			},
			{
				provider: input.provider,
				import: input.account.importId ?? input.account.id,
				ignoreChanges: input.account.roleName ? ['roleName'] : [],
			},
		)

		return {
			key: input.account.key,
			name: input.account.name,
			id: resource.id,
			arn: resource.arn,
			currentParentId: input.currentParentId,
			desiredParentId: input.desiredParentId,
			desiredParentKey: input.account.desiredParentKey,
			managed: true,
		}
	}

	const observedAccount = aws.organizations.Account.get(
		`observed-account-${input.account.key}`,
		input.account.id,
		undefined,
		{ provider: input.provider },
	)

	return {
		key: input.account.key,
		name: input.account.name,
		id: observedAccount.id,
		arn: observedAccount.arn,
		currentParentId: input.currentParentId,
		desiredParentId: input.desiredParentId,
		desiredParentKey: input.account.desiredParentKey,
		managed: false,
	}
}

function requireOrganizationalUnit(
	unitsByKey: Map<string, OrganizationalUnitRef>,
	key: string,
): OrganizationalUnitRef {
	const unit = unitsByKey.get(key)
	if (!unit) {
		throw new Error(
			`Organization unit '${key}' was referenced before creation.`,
		)
	}

	return unit
}
