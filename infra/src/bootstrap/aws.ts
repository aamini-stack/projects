import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'

import {
	DEFAULT_REGION,
	DEFAULT_STAGING_ACCOUNT_NAME,
	DEFAULT_MANAGEMENT_ACCOUNT_NAME,
	DEFAULT_PRODUCTION_ACCOUNT_NAME,
} from './constants.ts'
import type {
	AwsAccount,
	AwsIamGetRoleResponse,
	BootstrapAccountSelection,
	BootstrapOrganizationSelection,
	CallerIdentity,
	IdentityGroup,
	OrganizationInventory,
	SsoInstance,
} from './types.ts'

let awsNonInteractiveMode = false

export function setAwsNonInteractiveMode(enabled: boolean): void {
	awsNonInteractiveMode = enabled
}

export function resolveProfile(cliProfile: string | undefined): string {
	const profile =
		cliProfile ?? process.env.AWS_PROFILE ?? process.env.AWS_DEFAULT_PROFILE

	if (!profile) {
		throw new Error(
			'No AWS profile resolved. Pass --profile or set AWS_PROFILE/AWS_DEFAULT_PROFILE.',
		)
	}

	return profile
}

export function runAwsJson<T>(args: string[], profile?: string): T {
	const env = { ...process.env }
	const resolvedRegion =
		process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? DEFAULT_REGION
	env.AWS_REGION = resolvedRegion
	env.AWS_DEFAULT_REGION = resolvedRegion
	if (profile) {
		env.AWS_PROFILE = profile
	}

	const execute = (): string =>
		execFileSync('aws', [...args, '--output', 'json'], {
			encoding: 'utf8',
			env,
			stdio: ['ignore', 'pipe', 'pipe'],
		})

	try {
		const output = execute()
		return JSON.parse(output) as T
	} catch (error: unknown) {
		if (profile && awsNonInteractiveMode && isAwsSsoTokenExpiredError(error)) {
			throw new Error(
				`AWS SSO token expired for profile '${profile}' while --non-interactive is enabled. Run 'aws sso login --profile ${profile}' and retry.`,
			)
		}

		if (profile && isAwsSsoTokenExpiredError(error)) {
			console.log(
				`AWS SSO token expired for profile '${profile}', running aws sso login...`,
			)
			execFileSync('aws', ['sso', 'login', '--profile', profile], {
				encoding: 'utf8',
				env,
				stdio: 'inherit',
			})

			const output = execute()
			return JSON.parse(output) as T
		}

		throw error
	}
}

function isAwsSsoTokenExpiredError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false
	}

	const message = error.message.toLowerCase()
	return (
		message.includes('token has expired') ||
		message.includes('error when retrieving token from sso') ||
		message.includes('sso login')
	)
}

function canAssumeRole(
	accountId: string,
	roleName: string,
	profile: string,
): boolean {
	try {
		runAwsJson(
			[
				'sts',
				'assume-role',
				'--role-arn',
				`arn:aws:iam::${accountId}:role/${roleName}`,
				'--role-session-name',
				`bootstrap-probe-${randomBytes(4).toString('hex')}`,
				'--duration-seconds',
				'900',
			],
			profile,
		)
		return true
	} catch {
		return false
	}
}

export function resolveAssumeRoleNameForAccount(
	accountId: string,
	accountName: string,
	preferredRoleName: string,
	profile: string,
): string {
	const candidates = Array.from(
		new Set([
			preferredRoleName,
			'OrganizationAccountAccessRole',
			'AWSControlTowerExecution',
		]),
	)

	for (const candidate of candidates) {
		if (canAssumeRole(accountId, candidate, profile)) {
			if (candidate !== preferredRoleName) {
				console.log(
					`- account ${accountName}: using fallback assume role '${candidate}' (preferred '${preferredRoleName}' is not assumable)`,
				)
			}
			return candidate
		}
	}

	throw new Error(
		`Unable to assume any bootstrap role in account '${accountName}' (${accountId}). Tried: ${candidates.join(', ')}. Grant sts:AssumeRole and trust to your management principal, or pass --assume-role-name with a valid role.`,
	)
}

export function resolveManagementIdentityAssumeRoleName(
	accountId: string,
	accountName: string,
	preferredRoleName: string,
	profile: string,
): string {
	if (canAssumeRole(accountId, preferredRoleName, profile)) {
		return preferredRoleName
	}

	console.log(
		`- management account ${accountName}: identity assume role '${preferredRoleName}' is not assumable; using caller credentials instead`,
	)
	return 'none'
}

function roleExistsInAccount(roleName: string, profile: string): boolean {
	try {
		runAwsJson<AwsIamGetRoleResponse>(
			['iam', 'get-role', '--role-name', roleName],
			profile,
		)
		return true
	} catch {
		return false
	}
}

function toIamRoleArnFromAssumedRoleArn(arn: string): string | undefined {
	const match = /^arn:aws:sts::(\d+):assumed-role\/([^/]+)\/.+$/.exec(arn)
	if (!match) {
		return undefined
	}

	const accountId = match[1]
	const roleName = match[2]
	if (!accountId || !roleName) {
		return undefined
	}

	return `arn:aws:iam::${accountId}:role/${roleName}`
}

export function resolveCiCdPrincipalArn(
	managementAccountId: string,
	ciCdRoleName: string,
	callerArn: string,
	profile: string,
): string {
	const preferredRoleArn = `arn:aws:iam::${managementAccountId}:role/${ciCdRoleName}`
	if (roleExistsInAccount(ciCdRoleName, profile)) {
		return preferredRoleArn
	}

	const callerRoleArn = toIamRoleArnFromAssumedRoleArn(callerArn)
	if (callerRoleArn?.startsWith(`arn:aws:iam::${managementAccountId}:role/`)) {
		console.log(
			`- CI/CD role '${ciCdRoleName}' not found in management account; falling back to caller role principal ${callerRoleArn}`,
		)
		return callerRoleArn
	}

	const rootArn = `arn:aws:iam::${managementAccountId}:root`
	console.log(
		`- CI/CD role '${ciCdRoleName}' not found in management account; falling back to management root principal ${rootArn}`,
	)
	return rootArn
}

export function listOrganizationAccounts(profile: string): AwsAccount[] {
	const accounts: AwsAccount[] = []
	let nextToken: string | undefined

	do {
		const response = runAwsJson<{
			Accounts: AwsAccount[]
			NextToken?: string
		}>(
			[
				'organizations',
				'list-accounts',
				...(nextToken ? ['--next-token', nextToken] : []),
			],
			profile,
		)
		accounts.push(...response.Accounts)
		nextToken = response.NextToken
	} while (nextToken)

	return accounts
}

export function listIdentityStoreGroups(
	identityStoreId: string,
	profile: string,
): IdentityGroup[] {
	const groups: IdentityGroup[] = []
	let nextToken: string | undefined

	do {
		const response = runAwsJson<{
			Groups: IdentityGroup[]
			NextToken?: string
		}>(
			[
				'identitystore',
				'list-groups',
				'--identity-store-id',
				identityStoreId,
				...(nextToken ? ['--next-token', nextToken] : []),
			],
			profile,
		)

		groups.push(...response.Groups)
		nextToken = response.NextToken
	} while (nextToken)

	return groups
}

export function parseJsonOption<T>(
	value: string | undefined,
	label: string,
): T | undefined {
	if (!value) {
		return undefined
	}

	try {
		return JSON.parse(value) as T
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error)
		throw new Error(`Invalid ${label} JSON: ${message}`)
	}
}

function findActiveAccountByName(
	accounts: AwsAccount[],
	name: string,
): AwsAccount {
	const account = accounts.find((item) => item.Name === name)
	if (!account) {
		throw new Error(`AWS account '${name}' was not found in AWS Organizations`)
	}

	if (account.Status !== 'ACTIVE') {
		throw new Error(
			`AWS account '${name}' is not ACTIVE (status=${account.Status})`,
		)
	}

	return account
}

function findActiveAccountById(accounts: AwsAccount[], id: string): AwsAccount {
	const account = accounts.find((item) => item.Id === id)
	if (!account) {
		throw new Error(`AWS account '${id}' was not found in AWS Organizations`)
	}

	if (account.Status !== 'ACTIVE') {
		throw new Error(
			`AWS account '${account.Name}' (${account.Id}) is not ACTIVE (status=${account.Status})`,
		)
	}

	return account
}

export function resolveSelectedOrganizationAccount(
	accounts: AwsAccount[],
	requested: BootstrapAccountSelection,
): AwsAccount {
	if (requested.id) {
		const account = findActiveAccountById(accounts, requested.id)
		if (account.Name !== requested.name) {
			throw new Error(
				`Explicit organization account '${requested.name}' expected id ${requested.id}, but AWS returned '${account.Name}'.`,
			)
		}

		return account
	}

	return findActiveAccountByName(accounts, requested.name)
}

export function buildDefaultOrganizationSelection(input: {
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

export function buildDefaultOrganizationSelectionFromConstants(): BootstrapOrganizationSelection {
	return buildDefaultOrganizationSelection({
		managementAccountName: DEFAULT_MANAGEMENT_ACCOUNT_NAME,
		stagingAccountName: DEFAULT_STAGING_ACCOUNT_NAME,
		productionAccountName: DEFAULT_PRODUCTION_ACCOUNT_NAME,
	})
}

export function loadOrganizationInventory(input: {
	infraDir: string
	profile: string
	region: string
}): OrganizationInventory {
	return JSON.parse(
		execFileSync(
			'pnpm',
			[
				'--silent',
				'inventory:organization',
				'--profile',
				input.profile,
				'--region',
				input.region,
			],
			{
				cwd: input.infraDir,
				encoding: 'utf8',
				stdio: ['ignore', 'pipe', 'pipe'],
				env: process.env,
			},
		).trim(),
	) as OrganizationInventory
}

export function buildOrganizationImportsConfig(input: {
	inventory: OrganizationInventory
	managementAccountId: string
	stagingAccountId: string
	productionAccountId: string
}): { importedAccounts: string; importedPolicies: string } {
	const ouKeyById = new Map<string, string>()
	for (const unit of input.inventory.organizationalUnits ?? []) {
		const path = unit.path ?? unit.name
		if (path === 'Security') {
			ouKeyById.set(unit.id, 'security')
		} else if (path === 'Workloads') {
			ouKeyById.set(unit.id, 'workloads')
		} else if (path === 'Workloads/Staging') {
			ouKeyById.set(unit.id, 'workloads-staging')
		} else if (path === 'Workloads/Production') {
			ouKeyById.set(unit.id, 'workloads-production')
		}
	}

	const importedAccounts = (input.inventory.accounts ?? [])
		.filter(
			(account) =>
				account.id !== input.managementAccountId &&
				account.id !== input.stagingAccountId &&
				account.id !== input.productionAccountId,
		)
		.map((account) => {
			const parentKey = ouKeyById.get(account.parentId ?? '')
			if (!parentKey) {
				throw new Error(
					`Imported account '${account.name}' has unsupported parent '${account.parentId ?? 'unknown'}'.`,
				)
			}

			return {
				key: toConfigKey(`${account.name}-${account.id.slice(-4)}`),
				name: account.name,
				id: account.id,
				parentKey,
			}
		})

	const importedPolicies = (input.inventory.policies ?? [])
		.filter((policy) => policy.name !== 'FullAWSAccess')
		.map((policy) => {
			const attachToKey = (policy.targetIds ?? [])
				.map((targetId) => ouKeyById.get(targetId))
				.find((targetKey): targetKey is string => Boolean(targetKey))

			return {
				key: toConfigKey(`${policy.name}-${policy.id}`),
				name: policy.name,
				id: policy.id,
				...(attachToKey ? { attachToKey } : {}),
			}
		})

	return {
		importedAccounts: JSON.stringify(importedAccounts),
		importedPolicies: JSON.stringify(importedPolicies),
	}
}

function toConfigKey(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

export function getOrCreateIdentityGroup(
	groups: IdentityGroup[],
	name: string,
	identityStoreId: string,
	profile: string,
	createMissingGroups: boolean,
	dryRun: boolean,
): IdentityGroup {
	const existing = groups.find((item) => item.DisplayName === name)
	if (existing) {
		return existing
	}

	if (!createMissingGroups) {
		throw new Error(
			`Identity Center group '${name}' was not found. Re-run with --create-missing-groups.`,
		)
	}

	if (dryRun) {
		const dryRunGroup: IdentityGroup = {
			DisplayName: name,
			GroupId: `dryrun-create-${name}`,
		}
		console.log(
			`Dry run: would create Identity Center group '${name}' in ${identityStoreId}`,
		)
		return dryRunGroup
	}

	const created = runAwsJson<{ GroupId: string; DisplayName: string }>(
		[
			'identitystore',
			'create-group',
			'--identity-store-id',
			identityStoreId,
			'--display-name',
			name,
			'--description',
			'Managed by infra bootstrap',
		],
		profile,
	)

	const group: IdentityGroup = {
		DisplayName: created.DisplayName || name,
		GroupId: created.GroupId,
	}
	groups.push(group)

	console.log(`Created Identity Center group '${name}' (${group.GroupId})`)

	return group
}

export function getCallerIdentity(profile: string): CallerIdentity {
	return runAwsJson<CallerIdentity>(['sts', 'get-caller-identity'], profile)
}

export function getSsoInstance(profile: string): SsoInstance {
	const instances = runAwsJson<{ Instances: SsoInstance[] }>(
		['sso-admin', 'list-instances'],
		profile,
	)
	const ssoInstance = instances.Instances[0]
	if (!ssoInstance) {
		throw new Error(
			'No IAM Identity Center instance found in this organization.',
		)
	}

	return ssoInstance
}
