import { randomBytes } from 'node:crypto'

import { execJson, execPassthrough } from './runtime.ts'

const DEFAULT_REGION = 'us-east-1'

export type AwsAccount = {
	Id: string
	Name: string
	Status: string
}

export type AssumedRoleCredentials = {
	AccessKeyId: string
	SecretAccessKey: string
	SessionToken: string
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

export type AwsOrganizationsRoot = {
	Id: string
	Name: string
}

export type AwsOrganizationsOu = {
	Id: string
	Name: string
	Arn: string
}

export type AwsOrganizationsAccount = {
	Id: string
	Name: string
	Email: string
	Status: string
}

export type AwsOrganizationsPolicy = {
	Id: string
	Arn: string
	Name: string
	Description?: string
	Type: string
}

export type AwsOrganizationsDescribePolicy = {
	Policy: {
		PolicySummary: AwsOrganizationsPolicy
		Content: string
	}
}

export type AwsOrganizationsTarget = {
	TargetId: string
	Type: string
	Name?: string
}

type AwsTargetInput = {
	profile: string
	region: string
}

type RunAwsJsonInput = {
	profile?: string | undefined
	region?: string | undefined
	credentials?: AssumedRoleCredentials | undefined
}

let awsNonInteractiveMode = false

export function setAwsNonInteractiveMode(enabled: boolean): void {
	awsNonInteractiveMode = enabled
}

export function buildAwsEnv(input: RunAwsJsonInput): NodeJS.ProcessEnv {
	const env = { ...process.env }
	const resolvedRegion =
		input.region ??
		process.env.AWS_REGION ??
		process.env.AWS_DEFAULT_REGION ??
		DEFAULT_REGION

	env.AWS_REGION = resolvedRegion
	env.AWS_DEFAULT_REGION = resolvedRegion

	if (input.profile) {
		env.AWS_PROFILE = input.profile
	}

	if (input.credentials) {
		env.AWS_ACCESS_KEY_ID = input.credentials.AccessKeyId
		env.AWS_SECRET_ACCESS_KEY = input.credentials.SecretAccessKey
		env.AWS_SESSION_TOKEN = input.credentials.SessionToken
		delete env.AWS_PROFILE
	}

	return env
}

export function runAwsJson<T>(args: string[], input: RunAwsJsonInput = {}): T {
	const env = buildAwsEnv(input)
	const execute = (): T =>
		execJson<T>({
			cmd: 'aws',
			args: [...args, '--output', 'json'],
			env,
		})

	try {
		return execute()
	} catch (error: unknown) {
		if (
			input.profile &&
			awsNonInteractiveMode &&
			isAwsSsoTokenExpiredError(error)
		) {
			throw new Error(
				`AWS SSO token expired for profile '${input.profile}' while --non-interactive is enabled. Run 'aws sso login --profile ${input.profile}' and retry.`,
			)
		}

		if (input.profile && isAwsSsoTokenExpiredError(error)) {
			console.log(
				`AWS SSO token expired for profile '${input.profile}', running aws sso login...`,
			)
			execPassthrough({
				cmd: 'aws',
				args: ['sso', 'login', '--profile', input.profile],
				env,
			})

			return execute()
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

export function getCallerIdentity(input: AwsTargetInput): CallerIdentity {
	return runAwsJson<CallerIdentity>(['sts', 'get-caller-identity'], input)
}

export function assumeAccountRole(input: {
	managementProfile: string
	region: string
	accountId: string
	roleName: string
	sessionName?: string
}): AssumedRoleCredentials {
	const session = runAwsJson<{
		Credentials: AssumedRoleCredentials
	}>(
		[
			'sts',
			'assume-role',
			'--role-arn',
			`arn:aws:iam::${input.accountId}:role/${input.roleName}`,
			'--role-session-name',
			input.sessionName ?? 'destroy-verification',
		],
		{
			profile: input.managementProfile,
			region: input.region,
		},
	)

	return session.Credentials
}

export function canAssumeRole(
	accountId: string,
	roleName: string,
	profile: string,
	region: string,
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
			{ profile, region },
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
	region: string,
): string {
	const candidates = Array.from(
		new Set([
			preferredRoleName,
			'OrganizationAccountAccessRole',
			'AWSControlTowerExecution',
		]),
	)

	for (const candidate of candidates) {
		if (canAssumeRole(accountId, candidate, profile, region)) {
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
	region: string,
): string {
	if (canAssumeRole(accountId, preferredRoleName, profile, region)) {
		return preferredRoleName
	}

	console.log(
		`- management account ${accountName}: identity assume role '${preferredRoleName}' is not assumable; using caller credentials instead`,
	)
	return 'none'
}

export function hasIamRole(input: {
	region: string
	roleName: string
	profile?: string
	credentials?: AssumedRoleCredentials
}): boolean {
	try {
		runAwsJson<AwsIamGetRoleResponse>(
			['iam', 'get-role', '--role-name', input.roleName],
			{
				profile: input.profile,
				region: input.region,
				credentials: input.credentials,
			},
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
	region: string,
): string {
	const preferredRoleArn = `arn:aws:iam::${managementAccountId}:role/${ciCdRoleName}`
	if (hasIamRole({ profile, region, roleName: ciCdRoleName })) {
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

export function listOrganizationAccounts(input: AwsTargetInput): AwsAccount[] {
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
			input,
		)
		accounts.push(...response.Accounts)
		nextToken = response.NextToken
	} while (nextToken)

	return accounts
}

export function accountByName(
	accounts: AwsAccount[],
	name: string,
): AwsAccount {
	const account = accounts.find((item) => item.Name === name)
	if (!account) {
		throw new Error(`Account '${name}' not found in AWS Organizations`)
	}

	if (account.Status !== 'ACTIVE') {
		throw new Error(`Account '${name}' is not ACTIVE`)
	}

	return account
}

export function accountById(accounts: AwsAccount[], id: string): AwsAccount {
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

export function listRoots(input: AwsTargetInput): AwsOrganizationsRoot[] {
	return runAwsJson<{ Roots: AwsOrganizationsRoot[] }>(
		['organizations', 'list-roots'],
		input,
	).Roots
}

export function listOrganizationalUnitsForParent(
	parentId: string,
	input: AwsTargetInput,
): AwsOrganizationsOu[] {
	const organizationalUnits: AwsOrganizationsOu[] = []
	let nextToken: string | undefined

	do {
		const response = runAwsJson<{
			OrganizationalUnits: AwsOrganizationsOu[]
			NextToken?: string
		}>(
			[
				'organizations',
				'list-organizational-units-for-parent',
				'--parent-id',
				parentId,
				...(nextToken ? ['--next-token', nextToken] : []),
			],
			input,
		)

		organizationalUnits.push(...response.OrganizationalUnits)
		nextToken = response.NextToken
	} while (nextToken)

	return organizationalUnits
}

export function listAccountsForParent(
	parentId: string,
	input: AwsTargetInput,
): AwsOrganizationsAccount[] {
	const accounts: AwsOrganizationsAccount[] = []
	let nextToken: string | undefined

	do {
		const response = runAwsJson<{
			Accounts: AwsOrganizationsAccount[]
			NextToken?: string
		}>(
			[
				'organizations',
				'list-accounts-for-parent',
				'--parent-id',
				parentId,
				...(nextToken ? ['--next-token', nextToken] : []),
			],
			input,
		)

		accounts.push(...response.Accounts)
		nextToken = response.NextToken
	} while (nextToken)

	return accounts
}

export function listPolicies(input: AwsTargetInput): AwsOrganizationsPolicy[] {
	const policies: AwsOrganizationsPolicy[] = []
	let nextToken: string | undefined

	do {
		const response = runAwsJson<{
			Policies: AwsOrganizationsPolicy[]
			NextToken?: string
		}>(
			[
				'organizations',
				'list-policies',
				'--filter',
				'SERVICE_CONTROL_POLICY',
				...(nextToken ? ['--next-token', nextToken] : []),
			],
			input,
		)

		policies.push(...response.Policies)
		nextToken = response.NextToken
	} while (nextToken)

	return policies
}

export function listTargetsForPolicy(
	policyId: string,
	input: AwsTargetInput,
): AwsOrganizationsTarget[] {
	const targets: AwsOrganizationsTarget[] = []
	let nextToken: string | undefined

	do {
		const response = runAwsJson<{
			Targets: AwsOrganizationsTarget[]
			NextToken?: string
		}>(
			[
				'organizations',
				'list-targets-for-policy',
				'--policy-id',
				policyId,
				...(nextToken ? ['--next-token', nextToken] : []),
			],
			input,
		)

		targets.push(...response.Targets)
		nextToken = response.NextToken
	} while (nextToken)

	return targets
}

export function describePolicy(
	policyId: string,
	input: AwsTargetInput,
): { description: string | undefined; content: string } {
	const response = runAwsJson<AwsOrganizationsDescribePolicy>(
		['organizations', 'describe-policy', '--policy-id', policyId],
		input,
	)

	return {
		description: response.Policy.PolicySummary.Description,
		content: response.Policy.Content,
	}
}

export function listIdentityStoreGroups(
	identityStoreId: string,
	profile: string,
	region: string,
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
			{ profile, region },
		)

		groups.push(...response.Groups)
		nextToken = response.NextToken
	} while (nextToken)

	return groups
}

export function getOrCreateIdentityGroup(
	groups: IdentityGroup[],
	name: string,
	identityStoreId: string,
	profile: string,
	region: string,
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
		{ profile, region },
	)

	const group: IdentityGroup = {
		DisplayName: created.DisplayName || name,
		GroupId: created.GroupId,
	}
	groups.push(group)

	console.log(`Created Identity Center group '${name}' (${group.GroupId})`)

	return group
}

export function getSsoInstance(profile: string, region: string): SsoInstance {
	const instances = runAwsJson<{ Instances: SsoInstance[] }>(
		['sso-admin', 'list-instances'],
		{ profile, region },
	)
	const ssoInstance = instances.Instances[0]
	if (!ssoInstance) {
		throw new Error(
			'No IAM Identity Center instance found in this organization.',
		)
	}

	return ssoInstance
}

export function listEksClusters(input: {
	region: string
	credentials: AssumedRoleCredentials
}): string[] {
	const response = runAwsJson<{ clusters: string[] }>(
		['eks', 'list-clusters'],
		{
			region: input.region,
			credentials: input.credentials,
		},
	)

	return response.clusters
}
