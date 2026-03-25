import { runAwsJson } from '../../aws/cli.ts'
import type { IdentityGroup, SsoInstance } from '../../aws/types.ts'

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
