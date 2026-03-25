import { formatStackLabel } from './build-plan.ts'
import type { BootstrapPlan } from './types.ts'

export function printBootstrapPlan(plan: BootstrapPlan): void {
	const { context, executionPlan } = plan

	console.log('Bootstrap preflight:')
	console.log(`- profile: ${context.profile}`)
	console.log(`- region: ${context.region}`)
	console.log(`- pulumi org: ${context.org}`)
	console.log(
		`- mode: ${context.nonInteractive ? 'non-interactive' : 'interactive'}`,
	)

	console.log('Resolved bootstrap plan:')
	console.log(
		`- command: ${context.command}${context.preview ? ' (preview)' : ''}`,
	)
	console.log(`- pulumi org: ${context.org}`)
	console.log(`- profile: ${context.profile}`)
	console.log(`- region: ${context.region}`)
	console.log(`- caller arn: ${context.caller.Arn}`)
	console.log(
		`- management account: ${context.managementAccount.Name} (${context.managementAccount.Id})`,
	)
	console.log(
		`- staging account: ${context.stagingAccount.Name} (${context.stagingAccount.Id})`,
	)
	console.log(
		`- production account: ${context.productionAccount.Name} (${context.productionAccount.Id})`,
	)
	console.log(`- identity store id: ${context.ssoInstance.IdentityStoreId}`)
	console.log(`- admins group id: ${context.adminsGroup.GroupId}`)
	console.log(`- developers group id: ${context.developersGroup.GroupId}`)
	console.log(`- readonly group id: ${context.readOnlyGroup.GroupId}`)
	console.log(`- requested accounts json: ${context.requestedAccounts}`)
	console.log(`- identity assume role: ${context.identityAssumeRoleName}`)
	console.log(`- staging assume role: ${context.stagingAssumeRoleName}`)
	console.log(`- production assume role: ${context.productionAssumeRoleName}`)
	console.log(`- repo: ${context.repo}`)
	console.log(`- trusted principal arn: ${context.trustedPrincipalArn}`)
	console.log(
		`- stack timeout: ${context.stackOperationTimeoutMinutes} minute(s)`,
	)
	console.log(`- stack retries: ${context.stackOperationRetries}`)

	if (executionPlan.some((stack) => stack.project === 'platform')) {
		if (!context.githubTokenInput) {
			console.log(
				'- github token: missing, using generated placeholder for bootstrap (set --github-token for production use)',
			)
		} else {
			console.log('- github token: provided')
		}

		if (!context.postgresPasswordInput) {
			console.log(
				'- postgres admin password: missing, generated one-time password for bootstrap',
			)
		} else {
			console.log('- postgres admin password: provided')
		}

		console.log(
			`- cloudflare origin hostname: ${context.cloudflareOriginHostname}`,
		)
		console.log(
			`- cloudflare auth mode: ${
				context.hasCloudflareApiToken
					? 'api token'
					: context.hasCloudflareGlobalKey
						? 'global key'
						: 'using existing stack config'
			}`,
		)
	}

	console.log('- execution order:')
	for (const stack of executionPlan) {
		console.log(`  - ${formatStackLabel(stack, context.org)}`)
	}
}
