import * as azure from '@pulumi/azure-native'
import * as command from '@pulumi/command'
import * as pulumi from '@pulumi/pulumi'
import { resourceGroupName } from './resource-group'

const config = new pulumi.Config('azure-native')
const githubConfig = new pulumi.Config('github')

const location = config.require('location')
const subscriptionId = config.require('subscriptionId')
const githubToken = githubConfig.requireSecret('token')

// AKS Cluster
const aksCluster = new azure.containerservice.ManagedCluster('aks', {
	dnsPrefix: 'aamini-stack',
	resourceGroupName: resourceGroupName,
	agentPoolProfiles: [
		{
			name: 'agentpool',
			count: 2,
			vmSize: 'Standard_D2d_v5',
			mode: 'System',
			upgradeSettings: {
				maxSurge: '10%',
			},
		},
	],
	networkProfile: {
		networkPlugin: 'azure',
		networkPluginMode: 'overlay',
		networkDataplane: 'cilium',
		podCidr: '192.168.0.0/16',
	},
	identity: {
		type: 'SystemAssigned',
	},
	oidcIssuerProfile: {
		enabled: true,
	},
	securityProfile: {
		workloadIdentity: {
			enabled: true,
		},
	},
})

// Creds
const workloadIdentity = new azure.managedidentity.UserAssignedIdentity(
	'azure-alb-identity',
	{
		location: location,
		resourceGroupName: resourceGroupName,
	},
)

const nodeResourceGroupId = aksCluster.nodeResourceGroup.apply(
	(nrg) => `subscriptions/${subscriptionId}/resourceGroups/${nrg}`,
)

new azure.authorization.RoleAssignment('reader-role', {
	roleDefinitionId: `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f606fba81ae7`,
	principalId: workloadIdentity.principalId,
	scope: nodeResourceGroupId,
	principalType: 'ServicePrincipal',
})

new azure.managedidentity.FederatedIdentityCredential('managed-identity', {
	federatedIdentityCredentialResourceName: workloadIdentity.name,
	resourceGroupName: resourceGroupName,
	resourceName: workloadIdentity.name,
	audiences: ['api://AzureADTokenExchange'],
	issuer: aksCluster.oidcIssuerProfile.apply((p) => p?.issuerURL || ''),
	subject: 'system:serviceaccount:azure-alb-system:alb-controller-sa',
})

// Get AKS credentials and update kubeconfig before running Flux
const getAksCredentials = new command.local.Command(
	'get-aks-credentials',
	{
		create: pulumi.interpolate`az aks get-credentials --name ${aksCluster.name} --resource-group ${resourceGroupName} --overwrite-existing`,
	},
	{ dependsOn: [aksCluster] },
)

new command.local.Command(
	'flux-boostrap',
	{
		create: pulumi.interpolate`flux bootstrap github --owner=aamini-stack --repository=projects --branch=feature/database --path=./packages/infra/manifests/gitops --personal --token-auth`,
		environment: {
			GITHUB_TOKEN: githubToken,
		},
	},
	{ dependsOn: [aksCluster, getAksCredentials] },
)

// Outputs
const creds = azure.containerservice.listManagedClusterUserCredentialsOutput({
	resourceGroupName: resourceGroupName,
	resourceName: aksCluster.name,
})
const encoded = creds.kubeconfigs[0]?.value
export const kubeconfig = pulumi.secret(
	encoded?.apply((enc) => Buffer.from(enc, 'base64').toString()) ?? '',
)
export const aksClusterId = aksCluster.id
/** @internal — consumed by networking.ts, not intended as a stack output */
export { getAksCredentials }
export const nodeResourceGroup = aksCluster.nodeResourceGroup
export const oidcIssuerUrl = aksCluster.oidcIssuerProfile.apply(
	(p) => p?.issuerURL || '',
)
