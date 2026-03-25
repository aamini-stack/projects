import { runAwsJson } from './cli.ts'
import type {
	AwsAccount,
	AwsOrganizationsAccount,
	AwsOrganizationsDescribePolicy,
	AwsOrganizationsOu,
	AwsOrganizationsPolicy,
	AwsOrganizationsRoot,
	AwsOrganizationsTarget,
} from './types.ts'

type AwsTargetInput = {
	profile: string
	region: string
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
