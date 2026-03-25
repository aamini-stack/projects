import type { DestroyCheckResult } from './check-destroy.ts'

export function printDestroyVerificationReport(
	results: DestroyCheckResult[],
): number {
	let failures = 0

	for (const result of results) {
		console.log(`Checking ${result.environment} (${result.accountId})`)

		if (result.clusterExists) {
			failures += 1
			console.log(`- fail: EKS cluster still exists (${result.clusterName})`)
			if (result.fluxNamespaceExists === true) {
				failures += 1
				console.log('- fail: flux-system namespace still exists')
			} else if (result.fluxNamespaceExists === 'skipped') {
				console.log(
					'- flux-system namespace check skipped (kubectl not installed)',
				)
			} else {
				console.log('- pass: flux-system namespace not found')
			}
		} else {
			console.log(`- pass: EKS cluster removed (${result.clusterName})`)
			console.log('- pass: flux-system namespace removed with cluster')
		}

		if (result.fluxRoleExists) {
			failures += 1
			console.log(`- fail: IAM role still exists (${result.fluxRoleName})`)
		} else {
			console.log(`- pass: IAM role removed (${result.fluxRoleName})`)
		}
	}

	return failures
}
