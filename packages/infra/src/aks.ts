import * as azure from '@pulumi/azure-native'
import * as containerservice from '@pulumi/azure-native/containerservice'
import * as command from '@pulumi/command'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

interface AksConfig {
	nodeCount: number
	vmSize: string
	maxSurge: string
}

interface FluxConfig {
	ociRepository: string
	ociTag: string
}

interface FluxOperatorConfig {
	githubRepository: string
	githubSecretName: string
	registryServer: string
	registryUsername: string
	registrySecretName: string
}

const config = new pulumi.Config()
const azureConfig = new pulumi.Config('azure-native')
const cloudflareConfig = new pulumi.Config('cloudflare')
const githubConfig = new pulumi.Config('github')
const aksConfig = config.requireObject<AksConfig>('aks')
const fluxConfig = config.getObject<FluxConfig>('flux') ?? {
	ociRepository: 'oci://ghcr.io/aamini-stack/projects-gitops',
	ociTag: 'latest',
}
const fluxOperatorConfig = config.getObject<FluxOperatorConfig>(
	'fluxOperator',
) ?? {
	githubRepository: 'aamini-stack/projects',
	githubSecretName: 'github-operator-auth',
	registryServer: 'ghcr.io',
	registryUsername: 'aamini-stack',
	registrySecretName: 'ghcr-auth',
}

const location = azureConfig.require('location')
const nodeResourceGroupName = azureConfig.require('nodeResourceGroup')
const resourceGroupName = azureConfig.require('resourceGroup')
const subscriptionId = azureConfig.require('subscriptionId')
const cloudflareApiToken = cloudflareConfig.requireSecret('apiToken')
const githubToken = githubConfig.requireSecret('token')

// AKS Cluster
const aksCluster = new azure.containerservice.ManagedCluster('aks', {
	dnsPrefix: 'aamini-stack',
	location: location,
	nodeResourceGroup: nodeResourceGroupName,
	resourceGroupName: resourceGroupName,
	agentPoolProfiles: [
		{
			name: 'agentpool',
			count: aksConfig.nodeCount,
			vmSize: aksConfig.vmSize,
			mode: 'System',
			upgradeSettings: {
				maxSurge: aksConfig.maxSurge,
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
	(nrg) => `/subscriptions/${subscriptionId}/resourceGroups/${nrg}`,
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
const getAksCredentials = new command.local.Command('get-aks-credentials', {
	create: pulumi.interpolate`az aks get-credentials --name ${aksCluster.name} --resource-group ${resourceGroupName} --overwrite-existing`,
})

const creds = containerservice.listManagedClusterUserCredentialsOutput({
	resourceGroupName: resourceGroupName,
	resourceName: aksCluster.name,
})

const encoded = creds.kubeconfigs[0]?.value
export const kubeconfig = pulumi.secret(
	encoded?.apply((enc) => Buffer.from(enc, 'base64').toString()) ?? '',
)

const k8sProvider = new k8s.Provider(
	'k8s-provider',
	{
		kubeconfig: kubeconfig,
	},
	{ dependsOn: [getAksCredentials] },
)

const fluxNamespace = new k8s.core.v1.Namespace(
	'flux-system',
	{
		metadata: {
			name: 'flux-system',
		},
	},
	{ provider: k8sProvider },
)

const ghcrAuth = pulumi.all([githubToken]).apply(([token]) =>
	JSON.stringify({
		auths: {
			[fluxOperatorConfig.registryServer]: {
				username: fluxOperatorConfig.registryUsername,
				password: token,
				auth: Buffer.from(
					`${fluxOperatorConfig.registryUsername}:${token}`,
				).toString('base64'),
			},
		},
	}),
)

const fluxInstanceValues = {
	instance: {
		distribution: {
			version: '2.x',
			registry: 'ghcr.io/fluxcd',
			artifact: 'oci://ghcr.io/controlplaneio-fluxcd/flux-operator-manifests',
		},
		components: [
			'source-controller',
			'kustomize-controller',
			'helm-controller',
			'notification-controller',
			'image-reflector-controller',
			'image-automation-controller',
		],
		cluster: {
			type: 'kubernetes',
			multitenant: false,
			networkPolicy: true,
			domain: 'cluster.local',
		},
		sync: {
			kind: 'OCIRepository',
			url: fluxConfig.ociRepository,
			ref: fluxConfig.ociTag,
			path: './bootstrap',
			pullSecret: fluxOperatorConfig.registrySecretName,
		},
	},
}

const fluxOperator = new k8s.helm.v3.Release(
	'flux-operator',
	{
		chart: 'oci://ghcr.io/controlplaneio-fluxcd/charts/flux-operator',
		namespace: fluxNamespace.metadata.name,
		createNamespace: false,
	},
	{ provider: k8sProvider, dependsOn: [fluxNamespace] },
)

new k8s.helm.v3.Release(
	'flux-instance',
	{
		chart: 'oci://ghcr.io/controlplaneio-fluxcd/charts/flux-instance',
		namespace: fluxNamespace.metadata.name,
		createNamespace: false,
		values: fluxInstanceValues,
	},
	{ provider: k8sProvider, dependsOn: [fluxNamespace, fluxOperator] },
)

// Provide Cloudflare credentials to Flux postBuild substitution without storing plaintext in git.
new k8s.core.v1.Secret(
	'networking-secrets',
	{
		metadata: {
			name: 'networking-secrets',
			namespace: fluxNamespace.metadata.name,
		},
		stringData: {
			CLOUDFLARE_API_TOKEN: cloudflareApiToken,
		},
	},
	{ provider: k8sProvider, dependsOn: [fluxNamespace] },
)

new k8s.core.v1.Secret(
	'github-operator-auth',
	{
		metadata: {
			name: fluxOperatorConfig.githubSecretName,
			namespace: fluxNamespace.metadata.name,
		},
		stringData: {
			username: 'flux',
			password: githubToken,
		},
	},
	{ provider: k8sProvider, dependsOn: [fluxNamespace] },
)

new k8s.core.v1.Secret(
	'ghcr-auth',
	{
		metadata: {
			name: fluxOperatorConfig.registrySecretName,
			namespace: fluxNamespace.metadata.name,
		},
		type: 'kubernetes.io/dockerconfigjson',
		stringData: {
			'.dockerconfigjson': ghcrAuth,
		},
	},
	{ provider: k8sProvider, dependsOn: [fluxNamespace] },
)

// Outputs
export const aksClusterId = aksCluster.id
export const aksClusterName = aksCluster.name
export const nodeResourceGroup = aksCluster.nodeResourceGroup
