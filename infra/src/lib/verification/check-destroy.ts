import { commandExists, execText } from '../process/exec.ts'
import { withTempEksKubeconfig } from '../temp/kubeconfig.ts'
import { hasIamRole } from '../aws/iam.ts'
import {
	accountByName,
	listOrganizationAccounts,
} from '../aws/organizations.ts'
import { listEksClusters } from '../aws/eks.ts'
import { assumeAccountRole } from '../aws/sts.ts'

export type DestroyCheckResult = {
	environment: string
	accountId: string
	clusterName: string
	fluxRoleName: string
	clusterExists: boolean
	fluxNamespaceExists: boolean | 'skipped'
	fluxRoleExists: boolean
}

export function checkDestroy(input: {
	profile: string
	region: string
	assumeRoleName: string
	stagingAccountName: string
	productionAccountName: string
	fluxRoleName: string
	clusterPrefix: string
}): DestroyCheckResult[] {
	const accounts = listOrganizationAccounts({
		profile: input.profile,
		region: input.region,
	})

	return [
		{
			name: 'staging',
			account: accountByName(accounts, input.stagingAccountName),
		},
		{
			name: 'production',
			account: accountByName(accounts, input.productionAccountName),
		},
	].map((target) => {
		const credentials = assumeAccountRole({
			managementProfile: input.profile,
			region: input.region,
			accountId: target.account.Id,
			roleName: input.assumeRoleName,
		})
		const clusterName = `${input.clusterPrefix}-${target.name}`
		const clusterExists = listEksClusters({
			region: input.region,
			credentials,
		}).includes(clusterName)
		const fluxNamespaceExists = clusterExists
			? checkFluxNamespace({
					region: input.region,
					clusterName,
					credentials,
				})
			: false
		const fluxRoleExists = hasIamRole({
			region: input.region,
			roleName: input.fluxRoleName,
			credentials,
		})

		return {
			environment: target.name,
			accountId: target.account.Id,
			clusterName,
			fluxRoleName: input.fluxRoleName,
			clusterExists,
			fluxNamespaceExists,
			fluxRoleExists,
		}
	})
}

function checkFluxNamespace(input: {
	region: string
	clusterName: string
	credentials: {
		AccessKeyId: string
		SecretAccessKey: string
		SessionToken: string
	}
}): boolean | 'skipped' {
	if (!commandExists('kubectl', ['version', '--client'])) {
		return 'skipped'
	}

	try {
		return withTempEksKubeconfig({
			clusterName: input.clusterName,
			region: input.region,
			credentials: input.credentials,
			fn: (kubeconfigPath) => {
				execText({
					cmd: 'kubectl',
					args: [
						'get',
						'namespace',
						'flux-system',
						'--kubeconfig',
						kubeconfigPath,
					],
				})
				return true
			},
		})
	} catch {
		return false
	}
}
