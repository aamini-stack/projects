import { accountById, accountByName } from '../../aws/organizations.ts'
import type { AwsAccount } from '../../aws/types.ts'
import type {
	BootstrapAccountSelection,
	BootstrapOrganizationSelection,
} from '../types.ts'

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

export function resolveSelectedOrganizationAccount(
	accounts: AwsAccount[],
	requested: BootstrapAccountSelection,
): AwsAccount {
	if (requested.id) {
		const account = accountById(accounts, requested.id)
		if (account.Name !== requested.name) {
			throw new Error(
				`Explicit organization account '${requested.name}' expected id ${requested.id}, but AWS returned '${account.Name}'.`,
			)
		}

		return account
	}

	return accountByName(accounts, requested.name)
}
