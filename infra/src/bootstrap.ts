import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { parseArgs } from 'node:util'
import * as auto from '@pulumi/pulumi/automation/index.js'

type AwsAccount = {
	Id: string
	Name: string
	Status: string
}

type AwsOrganizationsRoot = {
	Id: string
	Name: string
}

type AwsOrganizationsParent = {
	Id: string
	Type: string
}

type CallerIdentity = {
	Account: string
	Arn: string
	UserId: string
}

type SsoInstance = {
	InstanceArn: string
	IdentityStoreId: string
}

type IdentityGroup = {
	DisplayName: string
	GroupId: string
}

type AwsIamGetRoleResponse = {
	Role: {
		Arn: string
		RoleName: string
	}
}

type BootstrapTopologyAccount = {
	name: string
	id?: string
	currentParentId?: string
}

type BootstrapTopology = {
	management: BootstrapTopologyAccount
	staging: BootstrapTopologyAccount
	production: BootstrapTopologyAccount
	organizationalUnits: {
		staging: string
		core: string
		workloads: string
		production: string
	}
}

type StackProject = 'organization' | 'account-baseline' | 'platform'
type StackEnvironment = 'global' | 'staging' | 'production'
type ProjectTarget = StackProject | 'all'
type EnvironmentTarget = StackEnvironment | 'all'
type Command = 'up' | 'destroy'

type StackDefinition = {
	key: string
	project: StackProject
	environment: StackEnvironment
	workDir: string
	stack: string
	config: Record<string, { value: string; secret?: boolean }>
}

const DEFAULT_REGION = 'us-east-1'
const DEFAULT_ASSUME_ROLE_NAME = 'AWSControlTowerExecution'
const DEFAULT_CICD_ROLE_NAME = 'PulumiOperatorRole'
const DEFAULT_REQUESTED_ACCOUNTS = '[]'
const DEFAULT_MANAGEMENT_ACCOUNT_NAME = 'aamini-root'
const DEFAULT_STAGING_ACCOUNT_NAME = 'aamini-staging'
const DEFAULT_PRODUCTION_ACCOUNT_NAME = 'aamini-production'
const DEFAULT_ADMINS_GROUP_NAME = 'Admins'
const DEFAULT_DEVELOPERS_GROUP_NAME = 'Developers'
const DEFAULT_READONLY_GROUP_NAME = 'ReadOnly'
const DEFAULT_REPO = 'aamini-stack/projects'
const DEFAULT_BILLING_ALERT_EMAIL = 'platform-alerts@example.com'
const DEFAULT_STAGING_BUDGET_USD = '150'
const DEFAULT_PRODUCTION_BUDGET_USD = '500'
const DEFAULT_CLOUDFLARE_ORIGIN_HOSTNAME = 'origin.ariaamini.com'
const PLATFORM_PROJECT_ENABLED = false
const DEFAULT_STACK_OPERATION_TIMEOUT_MINUTES = 45
const DEFAULT_STACK_OPERATION_RETRIES = 2
const RETRY_BASE_DELAY_MS = 5_000

let awsNonInteractiveMode = false

type StackOperation = 'preview' | 'up' | 'preview-destroy' | 'destroy'

function resolveProfile(cliProfile: string | undefined): string {
	const profile =
		cliProfile ?? process.env.AWS_PROFILE ?? process.env.AWS_DEFAULT_PROFILE

	if (!profile) {
		throw new Error(
			'No AWS profile resolved. Pass --profile or set AWS_PROFILE/AWS_DEFAULT_PROFILE.',
		)
	}

	return profile
}

function runAwsJson<T>(args: string[], profile?: string): T {
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

function resolveAssumeRoleNameForAccount(
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

function resolveManagementIdentityAssumeRoleName(
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

function resolveCiCdPrincipalArn(
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

function runPulumiWhoAmI(): string {
	const output = execFileSync('pulumi', ['whoami'], {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	})

	return output.trim()
}

function parseCommand(value: string | undefined): Command {
	if (!value || value === 'up') {
		return 'up'
	}

	if (value === 'destroy') {
		return 'destroy'
	}

	throw new Error("Invalid command. Expected 'up' or 'destroy'.")
}

function parseProjectTarget(value: string): ProjectTarget {
	if (
		value === 'all' ||
		value === 'organization' ||
		value === 'landing-zone' ||
		value === 'account-baseline' ||
		value === 'platform'
	) {
		if (value === 'landing-zone') {
			return 'account-baseline'
		}

		return value
	}

	throw new Error(
		`Invalid --project '${value}'. Expected one of: all, organization, account-baseline, platform.`,
	)
}

function parseEnvironmentTarget(value: string): EnvironmentTarget {
	if (
		value === 'all' ||
		value === 'global' ||
		value === 'staging' ||
		value === 'production'
	) {
		return value
	}

	throw new Error(
		`Invalid --environment '${value}'. Expected one of: all, global, staging, production.`,
	)
}

function isStackNotFoundError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false
	}

	const message = error.message.toLowerCase()
	return (
		message.includes('stack') &&
		(message.includes('not found') ||
			message.includes('does not exist') ||
			message.includes('no stack named'))
	)
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

function listOrganizationAccounts(profile: string): AwsAccount[] {
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

function listIdentityStoreGroups(
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

function listOrganizationRoots(profile: string): AwsOrganizationsRoot[] {
	const response = runAwsJson<{ Roots: AwsOrganizationsRoot[] }>(
		['organizations', 'list-roots'],
		profile,
	)

	return response.Roots
}

function getParentIdForChild(
	childId: string,
	profile: string,
): string | undefined {
	const response = runAwsJson<{ Parents: AwsOrganizationsParent[] }>(
		['organizations', 'list-parents', '--child-id', childId],
		profile,
	)

	return response.Parents[0]?.Id
}

function parseJsonOption<T>(
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

function resolveTopologyAccount(
	accounts: AwsAccount[],
	requested: BootstrapTopologyAccount,
): AwsAccount {
	if (requested.id) {
		const account = findActiveAccountById(accounts, requested.id)
		if (account.Name !== requested.name) {
			throw new Error(
				`Explicit topology account '${requested.name}' expected id ${requested.id}, but AWS returned '${account.Name}'.`,
			)
		}

		return account
	}

	return findActiveAccountByName(accounts, requested.name)
}

function buildDefaultTopology(input: {
	managementAccountName: string
	stagingAccountName: string
	productionAccountName: string
}): BootstrapTopology {
	return {
		management: { name: input.managementAccountName },
		staging: { name: input.stagingAccountName },
		production: { name: input.productionAccountName },
		organizationalUnits: {
			core: 'Core',
			workloads: 'Workloads',
			production: 'Production',
			staging: 'Staging',
		},
	}
}

function buildOrganizationInventoryConfig(input: {
	infraDir: string
	profile: string
	region: string
}): string {
	return execFileSync(
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
	).trim()
}

function buildOrganizationTopologyConfig(input: {
	topology: BootstrapTopology
	stagingAccountId: string
	productionAccountId: string
	requestedAccounts: string
}): string {
	const requestedAccounts = JSON.parse(input.requestedAccounts) as unknown[]

	return JSON.stringify({
		organizationalUnits: [
			{
				key: 'core',
				name: input.topology.organizationalUnits.core,
				parentKey: 'root',
			},
			{
				key: 'workloads',
				name: input.topology.organizationalUnits.workloads,
				parentKey: 'root',
			},
			{
				key: 'workloads-staging',
				name: input.topology.organizationalUnits.staging,
				parentKey: 'workloads',
			},
			{
				key: 'workloads-production',
				name: input.topology.organizationalUnits.production,
				parentKey: 'workloads',
			},
		],
		existingAccounts: [
			{
				key: 'staging',
				name: input.topology.staging.name,
				id: input.stagingAccountId,
				desiredParentKey: 'workloads-staging',
				currentParentId: input.topology.staging.currentParentId,
				adoptToDesiredParent: false,
			},
			{
				key: 'production',
				name: input.topology.production.name,
				id: input.productionAccountId,
				desiredParentKey: 'workloads-production',
				currentParentId: input.topology.production.currentParentId,
				adoptToDesiredParent: false,
			},
		],
		requestedAccounts,
		serviceControlPolicies: [],
		controlTowerGovernedOuKeys: ['workloads-staging', 'workloads-production'],
	})
}

function getOrCreateIdentityGroup(
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

function toConfigMap(
	config: Record<string, { value: string; secret?: boolean }>,
): auto.ConfigMap {
	return Object.fromEntries(Object.entries(config))
}

function resolveStackSelection(
	stacks: StackDefinition[],
	projectTarget: ProjectTarget,
	environmentTarget: EnvironmentTarget,
): StackDefinition[] {
	if (!PLATFORM_PROJECT_ENABLED && projectTarget === 'platform') {
		throw new Error(
			"The 'platform' project is temporarily disabled during organization/account-baseline rollout.",
		)
	}

	return stacks.filter((stack) => {
		if (!PLATFORM_PROJECT_ENABLED && stack.project === 'platform') {
			return false
		}

		if (projectTarget !== 'all' && stack.project !== projectTarget) {
			return false
		}

		if (
			environmentTarget !== 'all' &&
			stack.environment !== environmentTarget
		) {
			return false
		}

		return true
	})
}

function sortStacksForUp(stacks: StackDefinition[]): StackDefinition[] {
	const keyOrder = [
		'organization/global',
		'account-baseline/staging',
		'account-baseline/production',
		'platform/staging',
		'platform/production',
	]

	const order = new Map(keyOrder.map((key, index) => [key, index]))

	return [...stacks].sort((left, right) => {
		const leftIndex = order.get(left.key) ?? Number.MAX_SAFE_INTEGER
		const rightIndex = order.get(right.key) ?? Number.MAX_SAFE_INTEGER
		return leftIndex - rightIndex
	})
}

function sortStacksForDestroy(stacks: StackDefinition[]): StackDefinition[] {
	return sortStacksForUp(stacks).reverse()
}

function includesPlatform(stacks: StackDefinition[]): boolean {
	return stacks.some((stack) => stack.project === 'platform')
}

function requireProfile(profile: string | undefined): string {
	if (!profile) {
		throw new Error('AWS profile is required. Pass --profile or set a default.')
	}

	return profile
}

function getWorkspaceEnv(
	profile: string,
	region: string,
	dockerConfigDir?: string,
): Record<string, string> {
	return {
		AWS_PROFILE: profile,
		AWS_REGION: region,
		AWS_DEFAULT_REGION: region,
		...(dockerConfigDir ? { DOCKER_CONFIG: dockerConfigDir } : {}),
	}
}

function createEphemeralDockerConfig(): string {
	const dockerConfigDir = mkdtempSync(
		resolve(tmpdir(), 'bootstrap-docker-config-'),
	)
	const dockerConfigPath = resolve(dockerConfigDir, 'config.json')
	writeFileSync(dockerConfigPath, JSON.stringify({ auths: {} }))
	return dockerConfigDir
}

function nowIso(): string {
	return new Date().toISOString()
}

function formatDurationMs(durationMs: number): string {
	const seconds = Math.round(durationMs / 1_000)
	return `${seconds}s`
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolveSleep) => {
		setTimeout(resolveSleep, ms)
	})
}

function isTimeoutError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false
	}

	return error.message.toLowerCase().includes('timed out')
}

function isTransientStackError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false
	}

	const message = error.message.toLowerCase()
	return (
		message.includes('throttl') ||
		message.includes('rate exceeded') ||
		message.includes('too many requests') ||
		message.includes('timeout') ||
		message.includes('connection reset') ||
		message.includes('connection refused') ||
		message.includes('temporarily unavailable') ||
		message.includes('request limit exceeded') ||
		message.includes('internal error')
	)
}

async function runWithTimeout<T>(
	stackLabel: string,
	operation: StackOperation,
	timeoutMs: number,
	operationFn: () => Promise<T>,
): Promise<T> {
	let timeoutHandle: NodeJS.Timeout | undefined

	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutHandle = setTimeout(() => {
			reject(
				new Error(
					`${operation} timed out after ${formatDurationMs(timeoutMs)} for ${stackLabel}`,
				),
			)
		}, timeoutMs)
	})

	try {
		return await Promise.race([operationFn(), timeoutPromise])
	} finally {
		if (timeoutHandle) {
			clearTimeout(timeoutHandle)
		}
	}
}

async function runStackOperationWithRetry(
	stackLabel: string,
	operation: StackOperation,
	timeoutMs: number,
	retries: number,
	operationFn: () => Promise<void>,
): Promise<void> {
	const attempts = retries + 1

	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		const startedAt = Date.now()
		console.log(
			`[${nowIso()}] ${operation} start: ${stackLabel} (attempt ${attempt}/${attempts})`,
		)

		try {
			await runWithTimeout(stackLabel, operation, timeoutMs, operationFn)
			console.log(
				`[${nowIso()}] ${operation} complete: ${stackLabel} (${formatDurationMs(
					Date.now() - startedAt,
				)})`,
			)
			return
		} catch (error: unknown) {
			const canRetry =
				attempt < attempts &&
				(isTransientStackError(error) || isTimeoutError(error))
			if (!canRetry) {
				throw error
			}

			const waitMs = RETRY_BASE_DELAY_MS * attempt
			const message = error instanceof Error ? error.message : String(error)
			console.log(
				`[${nowIso()}] ${operation} retry: ${stackLabel} in ${Math.round(
					waitMs / 1_000,
				)}s (${message})`,
			)
			await sleep(waitMs)
		}
	}
}

function runCommand(
	command: string,
	args: string[],
	env: NodeJS.ProcessEnv,
): void {
	execFileSync(command, args, {
		encoding: 'utf8',
		env,
		stdio: ['ignore', 'pipe', 'pipe'],
	})
}

function runBestEffortCommand(
	command: string,
	args: string[],
	env: NodeJS.ProcessEnv,
): void {
	try {
		runCommand(command, args, env)
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error)
		console.log(
			`- warning: ${command} ${args.join(' ')} failed during cleanup (${message})`,
		)
	}
}

async function runFluxPreDestroyCleanup(
	stack: auto.Stack,
	stackDef: StackDefinition,
	profile: string,
	region: string,
): Promise<void> {
	const outputs = await stack.outputs()
	const kubeconfigOutput = outputs.kubeconfig?.value
	if (typeof kubeconfigOutput !== 'string' || kubeconfigOutput.length === 0) {
		console.log(
			`- flux pre-destroy: skipped for ${stackDef.key} (missing kubeconfig output)`,
		)
		return
	}

	const tempDir = mkdtempSync(resolve(tmpdir(), 'flux-cleanup-'))
	const kubeconfigPath = resolve(tempDir, 'kubeconfig')
	writeFileSync(kubeconfigPath, kubeconfigOutput, { mode: 0o600 })

	const commandEnv: NodeJS.ProcessEnv = {
		...process.env,
		AWS_PROFILE: profile,
		AWS_REGION: region,
		AWS_DEFAULT_REGION: region,
		KUBECONFIG: kubeconfigPath,
	}

	try {
		console.log(
			`- flux pre-destroy: uninstalling Flux resources for ${stackDef.key}`,
		)
		runBestEffortCommand(
			'helm',
			['uninstall', 'flux-instance', '-n', 'flux-system'],
			commandEnv,
		)
		runBestEffortCommand(
			'helm',
			['uninstall', 'flux-operator', '-n', 'flux-system'],
			commandEnv,
		)
		runBestEffortCommand(
			'kubectl',
			['delete', 'namespace', 'flux-system', '--wait=false'],
			commandEnv,
		)
		runBestEffortCommand(
			'kubectl',
			[
				'patch',
				'namespace',
				'flux-system',
				'--type',
				'merge',
				'-p',
				'{"spec":{"finalizers":[]}}',
			],
			commandEnv,
		)
	} finally {
		rmSync(tempDir, { force: true, recursive: true })
	}
}

async function upOrPreviewStack(
	org: string,
	stackDef: StackDefinition,
	previewOnly: boolean,
	profile: string,
	region: string,
	stackOperationTimeoutMs: number,
	stackOperationRetries: number,
	dockerConfigDir?: string,
): Promise<void> {
	const stackName = `${org}/${stackDef.stack}`
	const stackLabel = `${stackDef.key} (${stackName})`
	const stack = await auto.LocalWorkspace.createOrSelectStack(
		{
			stackName,
			workDir: stackDef.workDir,
		},
		{
			envVars: getWorkspaceEnv(profile, region, dockerConfigDir),
		},
	)

	await stack.setAllConfig(toConfigMap(stackDef.config))
	console.log(`Configured ${stackLabel}`)

	if (previewOnly) {
		await runStackOperationWithRetry(
			stackLabel,
			'preview',
			stackOperationTimeoutMs,
			stackOperationRetries,
			async () => {
				await stack.preview({
					onOutput: (line: string) => process.stdout.write(`${line}\n`),
				})
			},
		)
		return
	}

	await runStackOperationWithRetry(
		stackLabel,
		'up',
		stackOperationTimeoutMs,
		stackOperationRetries,
		async () => {
			await stack.up({
				onOutput: (line: string) => process.stdout.write(`${line}\n`),
			})
		},
	)
}

async function destroyOrPreviewDestroyStack(
	org: string,
	stackDef: StackDefinition,
	previewOnly: boolean,
	removeStacks: boolean,
	profile: string,
	region: string,
	stackOperationTimeoutMs: number,
	stackOperationRetries: number,
	dockerConfigDir?: string,
): Promise<void> {
	const stackName = `${org}/${stackDef.stack}`
	const stackLabel = `${stackDef.key} (${stackName})`
	let stack: auto.Stack

	try {
		stack = await auto.LocalWorkspace.selectStack(
			{
				stackName,
				workDir: stackDef.workDir,
			},
			{
				envVars: getWorkspaceEnv(profile, region, dockerConfigDir),
			},
		)
	} catch (error: unknown) {
		if (isStackNotFoundError(error)) {
			console.log(`Skipping missing stack ${stackLabel}`)
			return
		}

		throw error
	}

	await stack.setAllConfig(toConfigMap(stackDef.config))

	if (previewOnly) {
		await runStackOperationWithRetry(
			stackLabel,
			'preview-destroy',
			stackOperationTimeoutMs,
			stackOperationRetries,
			async () => {
				await stack.previewDestroy({
					onOutput: (line: string) => process.stdout.write(`${line}\n`),
				})
			},
		)
		return
	}

	if (stackDef.project === 'platform') {
		await runFluxPreDestroyCleanup(stack, stackDef, profile, region)
	}

	await runStackOperationWithRetry(
		stackLabel,
		'destroy',
		stackOperationTimeoutMs,
		stackOperationRetries,
		async () => {
			await stack.destroy({
				remove: removeStacks,
				onOutput: (line: string) => process.stdout.write(`${line}\n`),
			})
		},
	)

	if (removeStacks) {
		console.log(`Destroyed and removed stack ${stackDef.key}`)
	} else {
		console.log(`Destroyed resources for stack ${stackDef.key}`)
	}
}

function formatStackLabel(stack: StackDefinition, org: string): string {
	return `${stack.key} (${org}/${stack.stack})`
}

function printUsage(): void {
	console.log('Usage: pnpm bootstrap -- [up|destroy] [options]')
	console.log('')
	console.log('Examples:')
	console.log('  pnpm bootstrap -- up --profile aamini-root')
	console.log('  pnpm bootstrap -- up --preview')
	console.log('  pnpm bootstrap -- up --check --project organization')
	console.log(
		'  pnpm bootstrap -- destroy --project account-baseline --environment staging --remove-stacks',
	)
	console.log(
		'  pnpm bootstrap -- up --stack-timeout-minutes 60 --stack-retries 3',
	)
	console.log('')
	console.log('Profile resolution order:')
	console.log('  1) --profile')
	console.log('  2) AWS_PROFILE')
	console.log('  3) AWS_DEFAULT_PROFILE')
}

async function main(): Promise<void> {
	const cliArgs = process.argv.slice(2).filter((arg) => arg !== '--')

	const { values, positionals } = parseArgs({
		args: cliArgs,
		allowPositionals: true,
		options: {
			help: { type: 'boolean', default: false },
			check: { type: 'boolean' },
			nonInteractive: { type: 'boolean' },
			org: { type: 'string' },
			profile: { type: 'string' },
			region: { type: 'string' },
			preview: { type: 'boolean', default: false },
			dryRun: { type: 'boolean', default: false },
			project: { type: 'string', default: 'all' },
			environment: { type: 'string', default: 'all' },
			'remove-stacks': { type: 'boolean', default: false },
			'assume-role-name': { type: 'string' },
			'identity-assume-role-name': { type: 'string' },
			'cicd-role-name': { type: 'string' },
			'requested-accounts': { type: 'string' },
			'organization-topology': { type: 'string' },
			'organization-inventory': { type: 'string' },
			'management-account-name': { type: 'string' },
			'staging-account-name': { type: 'string' },
			'production-account-name': { type: 'string' },
			'admins-group-name': { type: 'string' },
			'developers-group-name': { type: 'string' },
			'readonly-group-name': { type: 'string' },
			'create-missing-groups': { type: 'boolean' },
			repo: { type: 'string' },
			'deployer-trusted-principal-arn': { type: 'string' },
			'billing-alert-email': { type: 'string' },
			'staging-budget-usd': { type: 'string' },
			'production-budget-usd': { type: 'string' },
			'github-token': { type: 'string' },
			'postgres-admin-password': { type: 'string' },
			'cloudflare-origin-hostname': { type: 'string' },
			'cloudflare-api-token': { type: 'string' },
			'stack-timeout-minutes': { type: 'string' },
			'stack-retries': { type: 'string' },
		},
	})

	if (values.help) {
		printUsage()
		return
	}

	const command = parseCommand(positionals[0])
	const currentFilePath = fileURLToPath(import.meta.url)
	const infraDir = resolve(dirname(currentFilePath), '..')
	const check = values.check ?? false
	const nonInteractive = values.nonInteractive ?? false
	awsNonInteractiveMode = nonInteractive

	const profile = requireProfile(resolveProfile(values.profile))
	const region =
		values.region ??
		process.env.AWS_REGION ??
		process.env.AWS_DEFAULT_REGION ??
		DEFAULT_REGION
	const org = values.org ?? process.env.PULUMI_ORG ?? runPulumiWhoAmI()
	const projectTarget = parseProjectTarget(values.project)
	const environmentTarget = parseEnvironmentTarget(values.environment)
	const preview = values.preview
	const dryRun = (values.dryRun ?? false) || check
	const removeStacks = values['remove-stacks']
	const assumeRoleName = values['assume-role-name'] ?? DEFAULT_ASSUME_ROLE_NAME
	const identityAssumeRoleNameOverride = values['identity-assume-role-name']
	const ciCdRoleName = values['cicd-role-name'] ?? DEFAULT_CICD_ROLE_NAME
	const requestedAccounts =
		values['requested-accounts'] ?? DEFAULT_REQUESTED_ACCOUNTS
	const createMissingGroups = values['create-missing-groups'] ?? true
	const repo = values.repo ?? DEFAULT_REPO
	const deployerTrustedPrincipalArn = values['deployer-trusted-principal-arn']
	const billingAlertEmail =
		values['billing-alert-email'] ?? DEFAULT_BILLING_ALERT_EMAIL
	const stagingBudgetUsd =
		values['staging-budget-usd'] ?? DEFAULT_STAGING_BUDGET_USD
	const productionBudgetUsd =
		values['production-budget-usd'] ?? DEFAULT_PRODUCTION_BUDGET_USD
	const githubTokenInput = values['github-token'] ?? process.env.GITHUB_TOKEN
	const postgresPasswordInput =
		values['postgres-admin-password'] ?? process.env.POSTGRES_ADMIN_PASSWORD
	const cloudflareOriginHostname =
		values['cloudflare-origin-hostname'] ?? DEFAULT_CLOUDFLARE_ORIGIN_HOSTNAME
	const stackTimeoutMinutesInput = values['stack-timeout-minutes']
	const stackRetriesInput = values['stack-retries']
	const cloudflareApiTokenInput =
		values['cloudflare-api-token'] ??
		process.env.CLOUDFLARE_API_TOKEN ??
		process.env.CLOUDFLARE_TOKEN
	const stackOperationTimeoutMinutes = stackTimeoutMinutesInput
		? Number.parseInt(stackTimeoutMinutesInput, 10)
		: DEFAULT_STACK_OPERATION_TIMEOUT_MINUTES
	const stackOperationRetries = stackRetriesInput
		? Number.parseInt(stackRetriesInput, 10)
		: DEFAULT_STACK_OPERATION_RETRIES
	const cloudflareEmailInput = process.env.CLOUDFLARE_EMAIL
	const cloudflareApiKeyInput = process.env.CLOUDFLARE_API_KEY
	const hasCloudflareApiToken = Boolean(cloudflareApiTokenInput)
	const hasCloudflareGlobalKey = Boolean(
		cloudflareEmailInput && cloudflareApiKeyInput,
	)

	if (command !== 'destroy' && removeStacks) {
		throw new Error('--remove-stacks is only valid with the destroy command.')
	}

	if (dryRun && preview) {
		throw new Error('Dry run cannot be combined with --preview.')
	}

	if (
		!Number.isFinite(stackOperationTimeoutMinutes) ||
		stackOperationTimeoutMinutes <= 0
	) {
		throw new Error('--stack-timeout-minutes must be a positive integer.')
	}

	if (!Number.isFinite(stackOperationRetries) || stackOperationRetries < 0) {
		throw new Error('--stack-retries must be a non-negative integer.')
	}

	const stackOperationTimeoutMs = stackOperationTimeoutMinutes * 60 * 1_000

	const managementAccountName =
		values['management-account-name'] ?? DEFAULT_MANAGEMENT_ACCOUNT_NAME
	const stagingAccountName =
		values['staging-account-name'] ?? DEFAULT_STAGING_ACCOUNT_NAME
	const productionAccountName =
		values['production-account-name'] ?? DEFAULT_PRODUCTION_ACCOUNT_NAME
	const adminsGroupName =
		values['admins-group-name'] ?? DEFAULT_ADMINS_GROUP_NAME
	const developersGroupName =
		values['developers-group-name'] ?? DEFAULT_DEVELOPERS_GROUP_NAME
	const readonlyGroupName =
		values['readonly-group-name'] ?? DEFAULT_READONLY_GROUP_NAME
	const providedTopology = parseJsonOption<BootstrapTopology>(
		values['organization-topology'],
		'--organization-topology',
	)
	const providedInventory = parseJsonOption<Record<string, unknown>>(
		values['organization-inventory'],
		'--organization-inventory',
	)

	console.log('Bootstrap preflight:')
	console.log(`- profile: ${profile}`)
	console.log(`- region: ${region}`)
	console.log(`- pulumi org: ${org}`)
	console.log(`- mode: ${nonInteractive ? 'non-interactive' : 'interactive'}`)

	const caller = runAwsJson<CallerIdentity>(
		['sts', 'get-caller-identity'],
		profile,
	)
	if (caller.Arn.endsWith(':root')) {
		throw new Error(
			`Refusing to continue with root credentials (${caller.Arn}). Use IAM Identity Center or an IAM role session.`,
		)
	}

	const accounts = listOrganizationAccounts(profile)
	const desiredTopology =
		providedTopology ??
		buildDefaultTopology({
			managementAccountName,
			stagingAccountName,
			productionAccountName,
		})
	const managementAccount = resolveTopologyAccount(
		accounts,
		desiredTopology.management,
	)
	if (caller.Account !== managementAccount.Id) {
		throw new Error(
			`Resolved caller account (${caller.Account}) does not match management account '${managementAccount.Name}' (${managementAccount.Id}). Re-authenticate with the management account profile or override --management-account-name.`,
		)
	}
	const stagingAccount = resolveTopologyAccount(
		accounts,
		desiredTopology.staging,
	)
	const productionAccount = resolveTopologyAccount(
		accounts,
		desiredTopology.production,
	)

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

	const groups = listIdentityStoreGroups(ssoInstance.IdentityStoreId, profile)
	const adminsGroup = getOrCreateIdentityGroup(
		groups,
		adminsGroupName,
		ssoInstance.IdentityStoreId,
		profile,
		createMissingGroups,
		dryRun,
	)
	const developersGroup = getOrCreateIdentityGroup(
		groups,
		developersGroupName,
		ssoInstance.IdentityStoreId,
		profile,
		createMissingGroups,
		dryRun,
	)
	const readOnlyGroup = getOrCreateIdentityGroup(
		groups,
		readonlyGroupName,
		ssoInstance.IdentityStoreId,
		profile,
		createMissingGroups,
		dryRun,
	)

	const generatedPostgresPassword = randomBytes(24).toString('base64url')
	const githubToken = githubTokenInput ?? 'bootstrap-placeholder-token'
	const postgresAdminPassword =
		postgresPasswordInput ?? generatedPostgresPassword

	const managementAccountId = managementAccount.Id
	const stagingAccountId = stagingAccount.Id
	const productionAccountId = productionAccount.Id
	const roots = listOrganizationRoots(profile)
	const root = roots[0]
	if (!root) {
		throw new Error(
			'No AWS Organizations root found in the current organization.',
		)
	}
	const stagingParentId =
		desiredTopology.staging.currentParentId ??
		getParentIdForChild(stagingAccountId, profile)
	const productionParentId =
		desiredTopology.production.currentParentId ??
		getParentIdForChild(productionAccountId, profile)
	const organizationTopologyConfig = buildOrganizationTopologyConfig({
		topology: {
			...desiredTopology,
			management: {
				...desiredTopology.management,
				id: managementAccountId,
			},
			staging: {
				...desiredTopology.staging,
				id: stagingAccountId,
				...(stagingParentId ? { currentParentId: stagingParentId } : {}),
			},
			production: {
				...desiredTopology.production,
				id: productionAccountId,
				...(productionParentId ? { currentParentId: productionParentId } : {}),
			},
		},
		stagingAccountId,
		productionAccountId,
		requestedAccounts,
	})
	const organizationInventoryConfig = providedInventory
		? JSON.stringify(providedInventory)
		: buildOrganizationInventoryConfig({
				infraDir,
				profile,
				region,
			})
	const stagingAssumeRoleName = resolveAssumeRoleNameForAccount(
		stagingAccountId,
		stagingAccount.Name,
		assumeRoleName,
		profile,
	)
	const productionAssumeRoleName = resolveAssumeRoleNameForAccount(
		productionAccountId,
		productionAccount.Name,
		assumeRoleName,
		profile,
	)
	const identityAssumeRoleName =
		identityAssumeRoleNameOverride ??
		resolveManagementIdentityAssumeRoleName(
			managementAccountId,
			managementAccount.Name,
			assumeRoleName,
			profile,
		)
	const ciCdPrincipalArn = resolveCiCdPrincipalArn(
		managementAccountId,
		ciCdRoleName,
		caller.Arn,
		profile,
	)
	const trustedPrincipalArn = deployerTrustedPrincipalArn ?? caller.Arn

	const sharedKubernetesConfig = JSON.stringify({
		version: '1.35',
		instanceType: 't3.medium',
		desiredCapacity: 2,
		minSize: 2,
		maxSize: 2,
	})

	const sharedPostgresConfig = JSON.stringify({
		instanceClass: 'db.t4g.micro',
		allocatedStorage: 20,
		maxAllocatedStorage: 100,
		backupRetentionDays: 7,
		engineVersion: '16.3',
		storageType: 'gp3',
		publiclyAccessible: false,
		deletionProtection: false,
		multiAz: false,
		allowedCidrs: ['172.31.0.0/16'],
	})

	const stackDefs: StackDefinition[] = [
		{
			key: 'organization/global',
			project: 'organization',
			environment: 'global',
			workDir: resolve(infraDir, 'src/organization'),
			stack: 'global',
			config: {
				'organization:managementAccountId': { value: managementAccountId },
				'organization:stagingAccountId': { value: stagingAccountId },
				'organization:productionAccountId': { value: productionAccountId },
				'organization:identityAssumeRoleName': {
					value: identityAssumeRoleName,
				},
				'organization:region': { value: region },
				'organization:adminsGroupId': { value: adminsGroup.GroupId },
				'organization:developersGroupId': { value: developersGroup.GroupId },
				'organization:readOnlyGroupId': { value: readOnlyGroup.GroupId },
				'organization:requestedAccounts': { value: requestedAccounts },
				'organization:topology': { value: organizationTopologyConfig },
				'organization:inventory': { value: organizationInventoryConfig },
			},
		},
		{
			key: 'account-baseline/staging',
			project: 'account-baseline',
			environment: 'staging',
			workDir: resolve(infraDir, 'src/account-baseline'),
			stack: 'staging',
			config: {
				'account-baseline:accountId': { value: stagingAccountId },
				'account-baseline:environment': { value: 'staging' },
				'account-baseline:managementAccountId': { value: managementAccountId },
				'account-baseline:assumeRoleName': { value: stagingAssumeRoleName },
				'account-baseline:region': { value: region },
				'account-baseline:budgetLimitUsd': { value: stagingBudgetUsd },
				'account-baseline:billingAlertEmail': { value: billingAlertEmail },
				'account-baseline:ciCdPrincipalArn': { value: ciCdPrincipalArn },
			},
		},
		{
			key: 'account-baseline/production',
			project: 'account-baseline',
			environment: 'production',
			workDir: resolve(infraDir, 'src/account-baseline'),
			stack: 'production',
			config: {
				'account-baseline:accountId': { value: productionAccountId },
				'account-baseline:environment': { value: 'production' },
				'account-baseline:managementAccountId': { value: managementAccountId },
				'account-baseline:assumeRoleName': { value: productionAssumeRoleName },
				'account-baseline:region': { value: region },
				'account-baseline:budgetLimitUsd': { value: productionBudgetUsd },
				'account-baseline:billingAlertEmail': { value: billingAlertEmail },
				'account-baseline:ciCdPrincipalArn': { value: ciCdPrincipalArn },
			},
		},
		{
			key: 'platform/staging',
			project: 'platform',
			environment: 'staging',
			workDir: resolve(infraDir, 'src/platform'),
			stack: 'staging',
			config: {
				'platform:accountId': { value: stagingAccountId },
				'platform:environment': { value: 'staging' },
				'platform:managementAccountId': { value: managementAccountId },
				'platform:assumeRoleName': { value: stagingAssumeRoleName },
				'platform:region': { value: region },
				'aws:region': { value: region },
				'platform:workloadBucketName': { value: 'aamini-staging-workloads' },
				'platform:ciCdPrincipalArn': { value: ciCdPrincipalArn },
				'platform:repo': { value: repo },
				'platform:deployerTrustedPrincipalArn': {
					value: trustedPrincipalArn,
				},
				'platform:kubernetes': { value: sharedKubernetesConfig },
				'platform:postgres': { value: sharedPostgresConfig },
				'platform:cloudflareOriginHostname': {
					value: cloudflareOriginHostname,
				},
				'github:token': { value: githubToken, secret: true },
				...(cloudflareApiTokenInput
					? {
							'cloudflare:apiToken': {
								value: cloudflareApiTokenInput,
								secret: true,
							},
						}
					: cloudflareEmailInput && cloudflareApiKeyInput
						? {
								'cloudflare:email': { value: cloudflareEmailInput },
								'cloudflare:apiKey': {
									value: cloudflareApiKeyInput,
									secret: true,
								},
							}
						: {}),
				'platform:postgresAdminPassword': {
					value: postgresAdminPassword,
					secret: true,
				},
			},
		},
		{
			key: 'platform/production',
			project: 'platform',
			environment: 'production',
			workDir: resolve(infraDir, 'src/platform'),
			stack: 'production',
			config: {
				'platform:accountId': { value: productionAccountId },
				'platform:environment': { value: 'production' },
				'platform:managementAccountId': { value: managementAccountId },
				'platform:assumeRoleName': { value: productionAssumeRoleName },
				'platform:region': { value: region },
				'aws:region': { value: region },
				'platform:workloadBucketName': {
					value: 'aamini-production-workloads',
				},
				'platform:ciCdPrincipalArn': { value: ciCdPrincipalArn },
				'platform:repo': { value: repo },
				'platform:deployerTrustedPrincipalArn': {
					value: trustedPrincipalArn,
				},
				'platform:kubernetes': { value: sharedKubernetesConfig },
				'platform:postgres': { value: sharedPostgresConfig },
				'platform:cloudflareOriginHostname': {
					value: cloudflareOriginHostname,
				},
				'github:token': { value: githubToken, secret: true },
				...(cloudflareApiTokenInput
					? {
							'cloudflare:apiToken': {
								value: cloudflareApiTokenInput,
								secret: true,
							},
						}
					: cloudflareEmailInput && cloudflareApiKeyInput
						? {
								'cloudflare:email': { value: cloudflareEmailInput },
								'cloudflare:apiKey': {
									value: cloudflareApiKeyInput,
									secret: true,
								},
							}
						: {}),
				'platform:postgresAdminPassword': {
					value: postgresAdminPassword,
					secret: true,
				},
			},
		},
	]

	const selected = resolveStackSelection(
		stackDefs,
		projectTarget,
		environmentTarget,
	)

	if (selected.length === 0) {
		throw new Error(
			`No stacks matched --project ${projectTarget} and --environment ${environmentTarget}.`,
		)
	}

	const executionPlan =
		command === 'destroy'
			? sortStacksForDestroy(selected)
			: sortStacksForUp(selected)

	console.log('Resolved bootstrap plan:')
	console.log(`- command: ${command}${preview ? ' (preview)' : ''}`)
	console.log(`- pulumi org: ${org}`)
	console.log(`- profile: ${profile}`)
	console.log(`- region: ${region}`)
	console.log(`- caller arn: ${caller.Arn}`)
	console.log(
		`- management account: ${managementAccount.Name} (${managementAccountId})`,
	)
	console.log(`- staging account: ${stagingAccount.Name} (${stagingAccountId})`)
	console.log(
		`- production account: ${productionAccount.Name} (${productionAccountId})`,
	)
	console.log(`- identity store id: ${ssoInstance.IdentityStoreId}`)
	console.log(`- admins group id: ${adminsGroup.GroupId}`)
	console.log(`- developers group id: ${developersGroup.GroupId}`)
	console.log(`- readonly group id: ${readOnlyGroup.GroupId}`)
	console.log(`- requested accounts json: ${requestedAccounts}`)
	console.log(`- identity assume role: ${identityAssumeRoleName}`)
	console.log(`- staging assume role: ${stagingAssumeRoleName}`)
	console.log(`- production assume role: ${productionAssumeRoleName}`)
	console.log(`- repo: ${repo}`)
	console.log(`- trusted principal arn: ${trustedPrincipalArn}`)
	console.log(`- stack timeout: ${stackOperationTimeoutMinutes} minute(s)`)
	console.log(`- stack retries: ${stackOperationRetries}`)

	if (includesPlatform(executionPlan)) {
		if (!githubTokenInput) {
			console.log(
				'- github token: missing, using generated placeholder for bootstrap (set --github-token for production use)',
			)
		} else {
			console.log('- github token: provided')
		}

		if (!postgresPasswordInput) {
			console.log(
				'- postgres admin password: missing, generated one-time password for bootstrap',
			)
		} else {
			console.log('- postgres admin password: provided')
		}

		console.log(`- cloudflare origin hostname: ${cloudflareOriginHostname}`)
		console.log(
			`- cloudflare auth mode: ${
				hasCloudflareApiToken
					? 'api token'
					: hasCloudflareGlobalKey
						? 'global key'
						: 'using existing stack config'
			}`,
		)
	}

	console.log('- execution order:')
	for (const stack of executionPlan) {
		console.log(`  - ${formatStackLabel(stack, org)}`)
	}

	if (dryRun) {
		if (check) {
			console.log(
				'Check mode enabled. Preflight completed; no Pulumi operations were run.',
			)
			return
		}

		console.log('Dry run enabled. Skipping all Pulumi operations.')
		return
	}

	const dockerConfigDir = includesPlatform(executionPlan)
		? createEphemeralDockerConfig()
		: undefined

	try {
		for (const stack of executionPlan) {
			if (command === 'destroy') {
				await destroyOrPreviewDestroyStack(
					org,
					stack,
					preview,
					removeStacks,
					profile,
					region,
					stackOperationTimeoutMs,
					stackOperationRetries,
					dockerConfigDir,
				)
				continue
			}

			await upOrPreviewStack(
				org,
				stack,
				preview,
				profile,
				region,
				stackOperationTimeoutMs,
				stackOperationRetries,
				dockerConfigDir,
			)
		}
	} finally {
		if (dockerConfigDir) {
			rmSync(dockerConfigDir, { force: true, recursive: true })
		}
	}

	console.log('Bootstrap complete.')
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error)
	console.error(`Bootstrap failed: ${message}`)
	process.exit(1)
})
