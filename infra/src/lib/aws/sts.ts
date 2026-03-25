import { randomBytes } from 'node:crypto'

import { runAwsJson } from './cli.ts'
import type { AssumedRoleCredentials, CallerIdentity } from './types.ts'

export function getCallerIdentity(input: {
	profile: string
	region: string
}): CallerIdentity {
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
