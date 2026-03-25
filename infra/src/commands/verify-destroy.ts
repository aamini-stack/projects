import { parseArgs } from 'node:util'

import { checkDestroy } from '../lib/verification/check-destroy.ts'
import { printDestroyVerificationReport } from '../lib/verification/report.ts'

const DEFAULT_REGION = 'us-east-1'
const DEFAULT_ASSUME_ROLE_NAME = 'AWSControlTowerExecution'
const DEFAULT_STAGING_ACCOUNT_NAME = 'aamini-staging'
const DEFAULT_PRODUCTION_ACCOUNT_NAME = 'aamini-production'
const DEFAULT_FLUX_ROLE_NAME = 'flux-ecr-readonly'
const DEFAULT_CLUSTER_PREFIX = 'aamini'

function main(): void {
	const { values } = parseArgs({
		args: process.argv.slice(2).filter((arg) => arg !== '--'),
		options: {
			profile: { type: 'string' },
			region: { type: 'string' },
			'assume-role-name': { type: 'string' },
			'staging-account-name': { type: 'string' },
			'production-account-name': { type: 'string' },
			'flux-role-name': { type: 'string' },
			'cluster-prefix': { type: 'string' },
		},
	})

	const profile = values.profile ?? process.env.AWS_PROFILE
	if (!profile) {
		throw new Error('Missing AWS profile. Pass --profile or set AWS_PROFILE.')
	}

	const results = checkDestroy({
		profile,
		region: values.region ?? DEFAULT_REGION,
		assumeRoleName: values['assume-role-name'] ?? DEFAULT_ASSUME_ROLE_NAME,
		stagingAccountName:
			values['staging-account-name'] ?? DEFAULT_STAGING_ACCOUNT_NAME,
		productionAccountName:
			values['production-account-name'] ?? DEFAULT_PRODUCTION_ACCOUNT_NAME,
		fluxRoleName: values['flux-role-name'] ?? DEFAULT_FLUX_ROLE_NAME,
		clusterPrefix: values['cluster-prefix'] ?? DEFAULT_CLUSTER_PREFIX,
	})
	const failures = printDestroyVerificationReport(results)

	if (failures > 0) {
		throw new Error(`Destroy verification failed with ${failures} issue(s).`)
	}

	console.log('Destroy verification passed.')
}

try {
	main()
} catch (error: unknown) {
	const message = error instanceof Error ? error.message : String(error)
	console.error(`Destroy verification failed: ${message}`)
	process.exit(1)
}
