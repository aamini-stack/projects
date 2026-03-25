import * as controltower from '@lbrlabs/pulumi-awscontroltower'

import type { RequestedAccount } from './config.ts'

export function createRequestedAccounts(requestedAccounts: RequestedAccount[]) {
	return requestedAccounts.map((account) => {
		const args: controltower.ControlTowerAwsAccountArgs = {
			name: account.name,
			email: account.email,
			organizationalUnit: account.organizationalUnit,
			closeAccountOnDelete: account.closeAccountOnDelete,
			organizationalUnitIdOnDelete: account.organizationalUnitIdOnDelete,
			provisionedProductName: account.provisionedProductName,
			pathId: account.pathId,
			sso: {
				firstName: account.ssoFirstName,
				lastName: account.ssoLastName,
				email: account.ssoEmail,
			},
			tags: {
				...account.tags,
				ManagedBy: 'Pulumi',
				Project: 'aamini-stack',
				Scope: 'organization',
			},
		}

		return new controltower.ControlTowerAwsAccount(account.name, args)
	})
}
