import type { ImportedAccount, ImportedPolicy } from './config.ts'

export const importedAccounts: ImportedAccount[] = [
	{
		key: 'cloudtrail-administrator-1691',
		name: 'CloudTrail administrator',
		id: '639098881691',
		parentKey: 'security',
	},
	{
		key: 'aggregator-account-4837',
		name: 'Aggregator account',
		id: '765151564837',
		parentKey: 'security',
	},
]

export const importedPolicies: ImportedPolicy[] = [
	{
		key: 'aws-guardrails-veasrx-p-c8zu0d23',
		name: 'aws-guardrails-VEaSrx',
		id: 'p-c8zu0d23',
		attachToKey: 'security',
	},
	{
		key: 'aws-guardrails-kxupwq-p-quyz3iax',
		name: 'aws-guardrails-kXuPWq',
		id: 'p-quyz3iax',
	},
]
