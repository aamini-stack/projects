import { execFileSync } from 'node:child_process'
import { parseArgs } from 'node:util'

type AwsOrganizationsRoot = {
	Id: string
	Name: string
}

type AwsOrganizationsOu = {
	Id: string
	Name: string
	Arn: string
}

type AwsOrganizationsAccount = {
	Id: string
	Name: string
	Email: string
	Status: string
}

type AwsOrganizationsPolicy = {
	Id: string
	Arn: string
	Name: string
	Description?: string
	Type: string
}

type AwsOrganizationsDescribePolicy = {
	Policy: {
		PolicySummary: AwsOrganizationsPolicy
		Content: string
	}
}

type AwsOrganizationsTarget = {
	TargetId: string
	Type: string
	Name?: string
}

function runAwsJson<T>(args: string[], profile: string, region: string): T {
	const env = {
		...process.env,
		AWS_PROFILE: profile,
		AWS_REGION: region,
		AWS_DEFAULT_REGION: region,
	}
	const output = execFileSync('aws', [...args, '--output', 'json'], {
		encoding: 'utf8',
		env,
		stdio: ['ignore', 'pipe', 'pipe'],
	})

	return JSON.parse(output) as T
}

function listRoots(profile: string, region: string): AwsOrganizationsRoot[] {
	return runAwsJson<{ Roots: AwsOrganizationsRoot[] }>(
		['organizations', 'list-roots'],
		profile,
		region,
	).Roots
}

function listOrganizationalUnitsForParent(
	parentId: string,
	profile: string,
	region: string,
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
			profile,
			region,
		)

		organizationalUnits.push(...response.OrganizationalUnits)
		nextToken = response.NextToken
	} while (nextToken)

	return organizationalUnits
}

function listAccountsForParent(
	parentId: string,
	profile: string,
	region: string,
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
			profile,
			region,
		)

		accounts.push(...response.Accounts)
		nextToken = response.NextToken
	} while (nextToken)

	return accounts
}

function listPolicies(
	profile: string,
	region: string,
): AwsOrganizationsPolicy[] {
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
			profile,
			region,
		)

		policies.push(...response.Policies)
		nextToken = response.NextToken
	} while (nextToken)

	return policies
}

function listTargetsForPolicy(
	policyId: string,
	profile: string,
	region: string,
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
			profile,
			region,
		)

		targets.push(...response.Targets)
		nextToken = response.NextToken
	} while (nextToken)

	return targets
}

function describePolicy(
	policyId: string,
	profile: string,
	region: string,
): { description: string | undefined; content: string } {
	const response = runAwsJson<AwsOrganizationsDescribePolicy>(
		['organizations', 'describe-policy', '--policy-id', policyId],
		profile,
		region,
	)

	return {
		description: response.Policy.PolicySummary.Description,
		content: response.Policy.Content,
	}
}

function collectTopology(
	parentId: string,
	parentPath: string,
	profile: string,
	region: string,
): {
	organizationalUnits: Array<{
		id: string
		name: string
		parentId: string
		path: string
	}>
	accounts: Array<{
		id: string
		name: string
		email: string
		parentId: string
	}>
} {
	const organizationalUnitsForParent = listOrganizationalUnitsForParent(
		parentId,
		profile,
		region,
	)
	const accountsForParent = listAccountsForParent(parentId, profile, region)
	const nestedTopology = organizationalUnitsForParent.map((unit) => {
		const path = parentPath ? `${parentPath}/${unit.Name}` : unit.Name
		return {
			unit: {
				id: unit.Id,
				name: unit.Name,
				parentId,
				path,
			},
			nested: collectTopology(unit.Id, path, profile, region),
		}
	})

	const organizationalUnits = nestedTopology.flatMap((entry) => [
		entry.unit,
		...entry.nested.organizationalUnits,
	])

	const accounts = accountsForParent
		.filter((account) => account.Status === 'ACTIVE')
		.map((account) => ({
			id: account.Id,
			name: account.Name,
			email: account.Email,
			parentId,
		}))

	const nestedAccounts = nestedTopology.flatMap(
		(entry) => entry.nested.accounts,
	)

	return {
		organizationalUnits,
		accounts: [...accounts, ...nestedAccounts],
	}
}

function main(): void {
	const { values } = parseArgs({
		args: process.argv.slice(2).filter((arg) => arg !== '--'),
		options: {
			profile: { type: 'string' },
			region: { type: 'string', default: 'us-east-1' },
		},
	})

	const profile = values.profile ?? process.env.AWS_PROFILE
	if (!profile) {
		throw new Error('Missing --profile (or AWS_PROFILE).')
	}

	const roots = listRoots(profile, values.region)
	const root = roots[0]
	if (!root) {
		throw new Error('No AWS Organizations root found.')
	}

	const topology = collectTopology(root.Id, '', profile, values.region)
	const policies = listPolicies(profile, values.region).map((policy) => {
		const details = describePolicy(policy.Id, profile, values.region)
		return {
			id: policy.Id,
			name: policy.Name,
			type: policy.Type,
			description: details.description,
			content: details.content,
			targetIds: listTargetsForPolicy(policy.Id, profile, values.region).map(
				(target) => target.TargetId,
			),
		}
	})

	process.stdout.write(
		`${JSON.stringify(
			{
				rootId: root.Id,
				organizationalUnits: topology.organizationalUnits,
				accounts: topology.accounts,
				policies,
			},
			undefined,
			2,
		)}\n`,
	)
}

try {
	main()
} catch (error: unknown) {
	const message = error instanceof Error ? error.message : String(error)
	console.error(`Organization inventory failed: ${message}`)
	process.exit(1)
}
