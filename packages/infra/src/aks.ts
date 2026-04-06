import * as azure from '@pulumi/azure-native'
import * as command from '@pulumi/command'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

const azureConfig = new pulumi.Config('azure-native')
const location = azureConfig.require('location')
const subscriptionId = azureConfig.require('subscriptionId')

const config = new pulumi.Config()
const resourceGroupName = config.require('resourceGroupName')
const githubOrganizationName = config.require('githubOrganizationName')
const githubRepositoryName = config.require('githubRepositoryName')
const aksSpecs = config.requireObject<{
	nodeCount: number
	vmSize: string
	maxSurge: string
}>('aksSpecs')
const githubRepositoryUrl = `https://github.com/${githubOrganizationName}/${githubRepositoryName}`

function createKubernetes() {
	// AKS Cluster
	const aksCluster = new azure.containerservice.ManagedCluster('aks-cluster', {
		dnsPrefix: 'aamini-stack',
		nodeResourceGroup: config.require('nodeResourceGroupName'),
		resourceGroupName: resourceGroupName,
		agentPoolProfiles: [
			{
				name: 'agentpool',
				count: aksSpecs.nodeCount,
				vmSize: aksSpecs.vmSize,
				mode: 'System',
				upgradeSettings: {
					maxSurge: aksSpecs.maxSurge,
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
		'aks-workload-identity',
		{
			location: location,
			resourceGroupName: resourceGroupName,
		},
	)

	const registry = new azure.containerregistry.Registry(
		'aks-container-registry',
		{
			location: 'westus',
			registryName: 'aaministack',
			resourceGroupName: resourceGroupName,
			sku: {
				name: azure.containerregistry.SkuName.Standard,
			},
		},
	)

	new azure.authorization.RoleAssignment('aks-reader-role', {
		roleDefinitionId: `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f606fba81ae7`,
		principalId: workloadIdentity.principalId,
		scope: aksCluster.nodeResourceGroup.apply(
			(nrg) => `/subscriptions/${subscriptionId}/resourceGroups/${nrg}`,
		),
		principalType: 'ServicePrincipal',
	})

	new azure.managedidentity.FederatedIdentityCredential(
		'aks-federated-credential',
		{
			federatedIdentityCredentialResourceName: workloadIdentity.name,
			resourceGroupName: resourceGroupName,
			resourceName: workloadIdentity.name,
			audiences: ['api://AzureADTokenExchange'],
			issuer: aksCluster.oidcIssuerProfile.apply((p) => p?.issuerURL || ''),
			subject: 'system:serviceaccount:azure-alb-system:alb-controller-sa',
		},
	)

	new azure.authorization.RoleAssignment('aks-image-pull-role', {
		roleDefinitionId: `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/7f951dda-4ed3-4680-a7ca-43fe172d538d`,
		principalId: aksCluster.identityProfile.apply(
			(identityProfile) => identityProfile?.kubeletidentity?.objectId || '',
		),
		scope: registry.id,
		principalType: 'ServicePrincipal',
	})

	// Get AKS credentials and update kubeconfig before running Flux
	new command.local.Command('aks-get-credentials-command', {
		create: pulumi.interpolate`az aks get-credentials --name ${aksCluster.name} --resource-group ${resourceGroupName} --overwrite-existing`,
	})

	const creds = azure.containerservice.listManagedClusterUserCredentialsOutput({
		resourceGroupName: resourceGroupName,
		resourceName: aksCluster.name,
	})

	const kubeconfig = pulumi.secret(
		creds.kubeconfigs[0]?.value.apply((enc: string) =>
			Buffer.from(enc, 'base64').toString(),
		) ?? '',
	)

	const k8sProvider = new k8s.Provider('aks-k8s-provider', {
		kubeconfig,
	})

	return {
		aksCluster,
		k8sProvider,
	}
}

function createFlux(k8sProvider: k8s.Provider) {
	const fluxNamespace = new k8s.core.v1.Namespace(
		'flux-system-namespace',
		{
			metadata: {
				name: 'flux-system',
			},
		},
		{ provider: k8sProvider },
	)

	const fluxOperator = new k8s.helm.v3.Release(
		'flux-operator-helm-release',
		{
			chart: 'oci://ghcr.io/controlplaneio-fluxcd/charts/flux-operator',
			namespace: fluxNamespace.metadata.name,
		},
		{ provider: k8sProvider },
	)

	new k8s.helm.v3.Release(
		'flux-instance-helm-release',
		{
			chart: 'oci://ghcr.io/controlplaneio-fluxcd/charts/flux-instance',
			namespace: fluxNamespace.metadata.name,
			values: {
				instance: {
					sync: {
						kind: 'GitRepository',
						url: githubRepositoryUrl,
						ref: 'refs/heads/ci',
						path: 'packages/infra/manifests/clusters/staging',
						pullSecret: 'github-api-token',
					},
				},
			},
		},
		{ provider: k8sProvider, dependsOn: [fluxOperator] },
	)

	new k8s.core.v1.Secret(
		'cloudflare-api-token',
		{
			metadata: {
				name: 'cloudflare-api-token',
				namespace: fluxNamespace.metadata.name,
			},
			stringData: {
				CLOUDFLARE_API_TOKEN: config.requireSecret('cloudflareApiToken'),
			},
		},
		{ provider: k8sProvider },
	)

	new k8s.core.v1.Secret(
		'github-api-token',
		{
			metadata: {
				name: 'github-api-token',
				namespace: fluxNamespace.metadata.name,
			},
			stringData: {
				username: 'flux',
				password: config.requireSecret('githubApiToken'),
			},
		},
		{ provider: k8sProvider },
	)

	return { aksCluster, k8sProvider }
}

const { aksCluster, k8sProvider } = createKubernetes()
createFlux(k8sProvider)

// Outputs
export const aksClusterId = aksCluster.id
export const aksClusterName = aksCluster.name
export const nodeResourceGroup = aksCluster.nodeResourceGroup
