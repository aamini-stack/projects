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

export type InventoryOrganizationalUnit = {
	id: string
	name: string
	parentId: string
	path?: string
}

export type InventoryAccount = {
	id: string
	name: string
	parentId?: string
	email?: string
}

export type InventoryPolicy = {
	id: string
	name: string
	type?: string
	description?: string
	content?: string
	targetIds?: string[]
}

export type OrganizationInventory = {
	rootId?: string
	organizationalUnits?: InventoryOrganizationalUnit[]
	accounts?: InventoryAccount[]
	policies?: InventoryPolicy[]
}

export type OrganizationalUnitTopology = {
	key: string
	name: string
	parentKey: 'root' | string
	importId: string | undefined
	path: string | undefined
}

export type ExistingAccountTopology = {
	key: string
	name: string
	id: string
	desiredParentKey: 'root' | string
	currentParentId: string | undefined
	email: string | undefined
	roleName: string | undefined
	importId: string | undefined
	adoptToDesiredParent: boolean | undefined
}

export type ServiceControlPolicyTopology = {
	key: string
	name: string
	description: string | undefined
	content: string
	targetKeys: string[]
	importId: string | undefined
	attachmentImportIds: Record<string, string> | undefined
	skipDestroyAttachments: boolean | undefined
}

export type OrganizationTopology = {
	organizationalUnits: OrganizationalUnitTopology[]
	existingAccounts: ExistingAccountTopology[]
	requestedAccounts: RequestedAccount[]
	serviceControlPolicies: ServiceControlPolicyTopology[]
	controlTowerGovernedOuKeys: string[]
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
	inventory: OrganizationInventory
	topology: OrganizationTopology
}

type PartialTopology = Partial<OrganizationTopology>

const DEFAULT_REGION = 'us-east-1'
const DEFAULT_MANAGEMENT_ACCOUNT_NAME = 'aamini-root'
const DEFAULT_STAGING_ACCOUNT_NAME = 'aamini-staging'
const DEFAULT_PRODUCTION_ACCOUNT_NAME = 'aamini-production'

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
	const inventory = config.getObject<OrganizationInventory>('inventory') ?? {}
	const configuredTopology = config.getObject<PartialTopology>('topology') ?? {}

	const topology = buildTopology({
		managementAccountId,
		stagingAccountId,
		productionAccountId,
		requestedAccounts,
		configuredTopology,
		inventory,
	})

	return {
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
	}
}

function buildTopology(input: {
	managementAccountId: string
	stagingAccountId: string
	productionAccountId: string
	requestedAccounts: RequestedAccount[]
	configuredTopology: PartialTopology
	inventory: OrganizationInventory
}): OrganizationTopology {
	const defaultTopology = createDefaultTopology({
		stagingAccountId: input.stagingAccountId,
		productionAccountId: input.productionAccountId,
		requestedAccounts: input.requestedAccounts,
	})

	const organizationalUnits = mergeOrganizationalUnits(
		input.configuredTopology.organizationalUnits ??
			defaultTopology.organizationalUnits,
		input.inventory,
	)
	const existingAccounts = mergeExistingAccounts(
		input.configuredTopology.existingAccounts ??
			defaultTopology.existingAccounts,
		input.inventory,
		input.managementAccountId,
	)

	const mergedTopology: OrganizationTopology = {
		organizationalUnits,
		existingAccounts,
		requestedAccounts:
			input.configuredTopology.requestedAccounts ??
			defaultTopology.requestedAccounts,
		serviceControlPolicies: mergePolicies(
			input.configuredTopology.serviceControlPolicies ??
				defaultTopology.serviceControlPolicies,
			input.inventory,
			existingAccounts,
			input.managementAccountId,
		),
		controlTowerGovernedOuKeys:
			input.configuredTopology.controlTowerGovernedOuKeys ??
			defaultTopology.controlTowerGovernedOuKeys,
	}

	const topologyWithPaths = attachPaths(mergedTopology.organizationalUnits)
	const inventoryAwareTopology = applyInventory({
		topology: {
			...mergedTopology,
			organizationalUnits: topologyWithPaths,
		},
		inventory: input.inventory,
	})

	validateTopology(inventoryAwareTopology, input.managementAccountId)

	return inventoryAwareTopology
}

function mergeOrganizationalUnits(
	configuredUnits: OrganizationalUnitTopology[],
	inventory: OrganizationInventory,
): OrganizationalUnitTopology[] {
	const unitsByPath = new Set(
		configuredUnits.map(
			(unit) => unit.path ?? buildPathFromUnit(unit, configuredUnits),
		),
	)
	const inferredUnits = (inventory.organizationalUnits ?? [])
		.filter((unit) => !unitsByPath.has(unit.path ?? unit.name))
		.sort((left, right) =>
			(left.path ?? left.name).localeCompare(right.path ?? right.name),
		)
		.map((unit) => ({
			key: toOrganizationalUnitKey(unit.path ?? unit.name),
			name: unit.name,
			parentKey:
				resolveInventoryParentKey(unit.parentId, inventory, configuredUnits) ??
				'root',
			importId: unit.id,
			path: unit.path ?? unit.name,
		}))

	return [...configuredUnits, ...inferredUnits]
}

function mergeExistingAccounts(
	configuredAccounts: ExistingAccountTopology[],
	inventory: OrganizationInventory,
	managementAccountId: string,
): ExistingAccountTopology[] {
	const configuredIds = new Set(configuredAccounts.map((account) => account.id))
	const configuredNames = new Set(
		configuredAccounts.map((account) => account.name),
	)
	const inferredAccounts = (inventory.accounts ?? [])
		.filter(
			(account) =>
				account.id !== managementAccountId &&
				!configuredIds.has(account.id) &&
				!configuredNames.has(account.name),
		)
		.sort((left, right) => left.name.localeCompare(right.name))
		.map((account) => ({
			key: toAccountKey(account.name, account.id),
			name: account.name,
			id: account.id,
			desiredParentKey:
				resolveInventoryParentKey(
					account.parentId ?? inventory.rootId ?? 'root',
					inventory,
					[],
				) ?? 'root',
			currentParentId: account.parentId,
			email: account.email,
			roleName: undefined,
			importId: account.id,
			adoptToDesiredParent: false,
		}))

	return [...configuredAccounts, ...inferredAccounts]
}

function mergePolicies(
	configuredPolicies: ServiceControlPolicyTopology[],
	inventory: OrganizationInventory,
	existingAccounts: ExistingAccountTopology[],
	managementAccountId: string,
): ServiceControlPolicyTopology[] {
	const configuredPolicyNames = new Set(
		configuredPolicies.map((policy) => policy.name),
	)
	const inferredPolicies = (inventory.policies ?? [])
		.filter(
			(policy) =>
				!configuredPolicyNames.has(policy.name) &&
				!isAwsManagedDefaultPolicy(policy),
		)
		.sort((left, right) => left.name.localeCompare(right.name))
		.map((policy) => ({
			key: toPolicyKey(policy.name, policy.id),
			name: policy.name,
			description: policy.description,
			content: policy.content ?? defaultImportedPolicyContent(policy.name),
			targetKeys: (policy.targetIds ?? [])
				.map((targetId) =>
					resolvePolicyTargetKey(
						targetId,
						inventory,
						existingAccounts,
						managementAccountId,
					),
				)
				.filter((targetKey): targetKey is string => Boolean(targetKey)),
			importId: policy.id,
			attachmentImportIds: Object.fromEntries(
				(policy.targetIds ?? [])
					.map((targetId) => {
						const targetKey = resolvePolicyTargetKey(
							targetId,
							inventory,
							existingAccounts,
							managementAccountId,
						)
						return targetKey
							? [targetKey, `${targetId}:${policy.id}`]
							: undefined
					})
					.filter((entry): entry is [string, string] => Boolean(entry)),
			),
			skipDestroyAttachments: policy.name === 'FullAWSAccess',
		}))

	return [...configuredPolicies, ...inferredPolicies]
}

function isAwsManagedDefaultPolicy(policy: InventoryPolicy): boolean {
	return policy.id === 'p-FullAWSAccess' || policy.name === 'FullAWSAccess'
}

function buildPathFromUnit(
	unit: OrganizationalUnitTopology,
	units: OrganizationalUnitTopology[],
): string {
	if (unit.path) {
		return unit.path
	}

	if (unit.parentKey === 'root') {
		return unit.name
	}

	const parent = units.find((candidate) => candidate.key === unit.parentKey)
	if (!parent) {
		return unit.name
	}

	return `${buildPathFromUnit(parent, units)}/${unit.name}`
}

function resolveInventoryParentKey(
	parentId: string,
	inventory: OrganizationInventory,
	configuredUnits: OrganizationalUnitTopology[],
): string | undefined {
	if (!parentId || parentId === inventory.rootId) {
		return 'root'
	}

	const configuredUnit = configuredUnits.find(
		(unit) => unit.importId === parentId,
	)
	if (configuredUnit) {
		return configuredUnit.key
	}

	const inventoryUnit = inventory.organizationalUnits?.find(
		(unit) => unit.id === parentId,
	)
	if (!inventoryUnit) {
		return undefined
	}

	return toOrganizationalUnitKey(inventoryUnit.path ?? inventoryUnit.name)
}

function resolvePolicyTargetKey(
	targetId: string,
	inventory: OrganizationInventory,
	existingAccounts: ExistingAccountTopology[],
	managementAccountId: string,
): string | undefined {
	if (targetId === inventory.rootId) {
		return 'root'
	}

	if (targetId === managementAccountId) {
		return 'managementAccount'
	}

	const inventoryUnit = inventory.organizationalUnits?.find(
		(unit) => unit.id === targetId,
	)
	if (inventoryUnit) {
		return `ou:${toOrganizationalUnitKey(inventoryUnit.path ?? inventoryUnit.name)}`
	}

	const inventoryAccount = inventory.accounts?.find(
		(account) => account.id === targetId,
	)
	if (inventoryAccount) {
		const existingAccount = existingAccounts.find(
			(account) => account.id === inventoryAccount.id,
		)
		return `account:${existingAccount?.key ?? toAccountKey(inventoryAccount.name, inventoryAccount.id)}`
	}

	return undefined
}

function toOrganizationalUnitKey(path: string): string {
	return normalizeKey(path.replaceAll('/', '-'))
}

function toAccountKey(name: string, accountId: string): string {
	return normalizeKey(`${name}-${accountId.slice(-4)}`)
}

function toPolicyKey(name: string, policyId: string): string {
	return normalizeKey(`${name}-${policyId}`)
}

function normalizeKey(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

function defaultImportedPolicyContent(name: string): string {
	if (name === 'FullAWSAccess') {
		return JSON.stringify(
			{
				Version: '2012-10-17',
				Statement: [
					{
						Sid: 'DefaultAllowAll',
						Effect: 'Allow',
						Action: '*',
						Resource: '*',
					},
				],
			},
			null,
			2,
		)
	}

	return JSON.stringify(
		{
			Version: '2012-10-17',
			Statement: [],
		},
		null,
		2,
	)
}

function createDefaultTopology(input: {
	stagingAccountId: string
	productionAccountId: string
	requestedAccounts: RequestedAccount[]
}): OrganizationTopology {
	return {
		organizationalUnits: [
			{
				key: 'core',
				name: 'Core',
				parentKey: 'root',
				importId: undefined,
				path: undefined,
			},
			{
				key: 'workloads',
				name: 'Workloads',
				parentKey: 'root',
				importId: undefined,
				path: undefined,
			},
			{
				key: 'workloads-staging',
				name: 'Staging',
				parentKey: 'workloads',
				importId: undefined,
				path: undefined,
			},
			{
				key: 'workloads-production',
				name: 'Production',
				parentKey: 'workloads',
				importId: undefined,
				path: undefined,
			},
		],
		existingAccounts: [
			{
				key: 'staging',
				name: DEFAULT_STAGING_ACCOUNT_NAME,
				id: input.stagingAccountId,
				desiredParentKey: 'workloads-staging',
				currentParentId: undefined,
				email: undefined,
				roleName: undefined,
				importId: undefined,
				adoptToDesiredParent: false,
			},
			{
				key: 'production',
				name: DEFAULT_PRODUCTION_ACCOUNT_NAME,
				id: input.productionAccountId,
				desiredParentKey: 'workloads-production',
				currentParentId: undefined,
				email: undefined,
				roleName: undefined,
				importId: undefined,
				adoptToDesiredParent: false,
			},
		],
		requestedAccounts: input.requestedAccounts,
		serviceControlPolicies: [],
		controlTowerGovernedOuKeys: ['workloads-staging', 'workloads-production'],
	}
}

function attachPaths(
	organizationalUnits: OrganizationalUnitTopology[],
): OrganizationalUnitTopology[] {
	const byKey = new Map(organizationalUnits.map((unit) => [unit.key, unit]))

	const resolvePath = (unit: OrganizationalUnitTopology): string => {
		if (unit.path) {
			return unit.path
		}

		if (unit.parentKey === 'root') {
			return unit.name
		}

		const parent = byKey.get(unit.parentKey)
		if (!parent) {
			throw new Error(
				`Topology OU '${unit.key}' references missing parent '${unit.parentKey}'.`,
			)
		}

		return `${resolvePath(parent)}/${unit.name}`
	}

	return organizationalUnits.map((unit) => ({
		...unit,
		path: resolvePath(unit),
	}))
}

function applyInventory(input: {
	topology: OrganizationTopology
	inventory: OrganizationInventory
}): OrganizationTopology {
	const organizationalUnits = input.topology.organizationalUnits.map((unit) => {
		const inventoryUnit = findInventoryOrganizationalUnit(input.inventory, unit)

		return {
			...unit,
			...((unit.importId ?? inventoryUnit?.id)
				? { importId: unit.importId ?? inventoryUnit?.id }
				: {}),
		}
	})

	const existingAccounts = input.topology.existingAccounts.map((account) => {
		const inventoryAccount = findInventoryAccount(input.inventory, account)

		return {
			...account,
			...((account.currentParentId ?? inventoryAccount?.parentId)
				? {
						currentParentId:
							account.currentParentId ?? inventoryAccount?.parentId,
					}
				: {}),
			...((account.email ?? inventoryAccount?.email)
				? { email: account.email ?? inventoryAccount?.email }
				: {}),
			...((account.importId ?? inventoryAccount?.id)
				? { importId: account.importId ?? inventoryAccount?.id }
				: {}),
		}
	})

	const serviceControlPolicies = input.topology.serviceControlPolicies.map(
		(policy) => {
			const inventoryPolicy = input.inventory.policies?.find(
				(candidate) => candidate.name === policy.name,
			)

			const attachmentImportIds = { ...(policy.attachmentImportIds ?? {}) }
			for (const targetId of inventoryPolicy?.targetIds ?? []) {
				if (inventoryPolicy) {
					attachmentImportIds[targetId] = `${targetId}:${inventoryPolicy.id}`
				}
			}

			return {
				...policy,
				...((policy.importId ?? inventoryPolicy?.id)
					? { importId: policy.importId ?? inventoryPolicy?.id }
					: {}),
				...(Object.keys(attachmentImportIds).length > 0
					? { attachmentImportIds }
					: {}),
			}
		},
	)

	return {
		...input.topology,
		organizationalUnits,
		existingAccounts,
		serviceControlPolicies,
	}
}

function findInventoryOrganizationalUnit(
	inventory: OrganizationInventory,
	unit: OrganizationalUnitTopology,
): InventoryOrganizationalUnit | undefined {
	return inventory.organizationalUnits?.find(
		(candidate) =>
			candidate.path === unit.path ||
			(candidate.name === unit.name && !candidate.path),
	)
}

function findInventoryAccount(
	inventory: OrganizationInventory,
	account: ExistingAccountTopology,
): InventoryAccount | undefined {
	return inventory.accounts?.find(
		(candidate) =>
			candidate.id === account.id || candidate.name === account.name,
	)
}

function validateTopology(
	topology: OrganizationTopology,
	managementAccountId: string,
): void {
	const ouKeys = new Set<string>()
	for (const unit of topology.organizationalUnits) {
		if (ouKeys.has(unit.key)) {
			throw new Error(`Duplicate organization unit key '${unit.key}'.`)
		}

		ouKeys.add(unit.key)
	}

	const accountKeys = new Set<string>()
	for (const account of topology.existingAccounts) {
		if (account.id === managementAccountId) {
			throw new Error(
				`Management account '${DEFAULT_MANAGEMENT_ACCOUNT_NAME}' must not be declared as an imported member account.`,
			)
		}

		if (accountKeys.has(account.key)) {
			throw new Error(`Duplicate existing account key '${account.key}'.`)
		}

		accountKeys.add(account.key)

		if (
			account.desiredParentKey !== 'root' &&
			!ouKeys.has(account.desiredParentKey)
		) {
			throw new Error(
				`Existing account '${account.key}' references unknown desired parent '${account.desiredParentKey}'.`,
			)
		}
	}

	for (const policy of topology.serviceControlPolicies) {
		for (const targetKey of policy.targetKeys) {
			if (targetKey === 'root' || targetKey === 'managementAccount') {
				continue
			}

			if (targetKey.startsWith('ou:')) {
				const key = targetKey.slice('ou:'.length)
				if (!ouKeys.has(key)) {
					throw new Error(
						`Service control policy '${policy.key}' targets unknown OU key '${targetKey}'.`,
					)
				}
				continue
			}

			if (targetKey.startsWith('account:')) {
				const key = targetKey.slice('account:'.length)
				if (!accountKeys.has(key)) {
					throw new Error(
						`Service control policy '${policy.key}' targets unknown account key '${targetKey}'.`,
					)
				}
				continue
			}

			if (!ouKeys.has(targetKey)) {
				throw new Error(
					`Service control policy '${policy.key}' uses ambiguous target key '${targetKey}'. Use 'ou:${targetKey}' or 'account:${targetKey}'.`,
				)
			}
		}
	}

	for (const unit of topology.organizationalUnits) {
		if (unit.parentKey !== 'root' && !ouKeys.has(unit.parentKey)) {
			throw new Error(
				`Organization unit '${unit.key}' references unknown parent '${unit.parentKey}'.`,
			)
		}
	}

	for (const governedOuKey of topology.controlTowerGovernedOuKeys) {
		if (!ouKeys.has(governedOuKey)) {
			throw new Error(
				`Control Tower governed OU key '${governedOuKey}' is not defined in topology.`,
			)
		}
	}
}
