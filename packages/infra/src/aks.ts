import * as azure from '@pulumi/azure-native'
import * as command from '@pulumi/command'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'
import { ManagedCluster } from '@pulumi/azure-native/containerservice'
import { resourceGroup } from './resource-groups'

const azureConfig = new pulumi.Config('azure-native')
const location = azureConfig.require('location')
const subscriptionId = azureConfig.require('subscriptionId')

const config = new pulumi.Config()
const githubOrganizationName = config.require('githubOrganizationName')
const githubRepositoryName = config.require('githubRepositoryName')
const registryName = 'aaministack'
const publicIngressIpName = `pip-aamini-${pulumi.getStack()}`
const aksSpecs = config.requireObject<{
	nodeCount: number
	vmSize: string
	maxSurge: string
}>('aksSpecs')
const githubRepositoryUrl = `https://github.com/${githubOrganizationName}/${githubRepositoryName}`
const infraDir = process.cwd()

function createKubernetes() {
	const aksCluster = new azure.containerservice.ManagedCluster('aks-cluster', {
		dnsPrefix: 'aamini-stack',
		resourceGroupName: resourceGroup.name,
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
	const albWorkloadIdentity = new azure.managedidentity.UserAssignedIdentity(
		'aks-workload-identity',
		{
			location: location,
			resourceGroupName: resourceGroup.name,
		},
	)

	const externalSecretsWorkloadIdentity =
		new azure.managedidentity.UserAssignedIdentity(
			'external-secrets-workload-identity',
			{
				location,
				resourceGroupName: resourceGroup.name,
			},
		)

	const registry = new azure.containerregistry.Registry(
		'aks-container-registry',
		{
			location: 'westus',
			registryName,
			resourceGroupName: resourceGroup.name,
			sku: {
				name: azure.containerregistry.SkuName.Standard,
			},
		},
	)

	const ingressPublicIp = new azure.network.PublicIPAddress(
		'aks-ingress-public-ip',
		{
			location,
			publicIpAddressName: publicIngressIpName,
			resourceGroupName: resourceGroup.name,
			publicIPAllocationMethod: 'Static',
			sku: {
				name: 'Standard',
			},
		},
		{ deletedWith: resourceGroup },
	)

	new azure.authorization.RoleAssignment('aks-reader-role', {
		roleDefinitionId: `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f606fba81ae7`,
		principalId: albWorkloadIdentity.principalId,
		scope: aksCluster.nodeResourceGroup.apply(
			(nrg: string | undefined) =>
				`/subscriptions/${subscriptionId}/resourceGroups/${nrg ?? ''}`,
		),
		principalType: 'ServicePrincipal',
	})

	new azure.managedidentity.FederatedIdentityCredential(
		'aks-federated-credential',
		{
			federatedIdentityCredentialResourceName: albWorkloadIdentity.name,
			resourceGroupName: resourceGroup.name,
			resourceName: albWorkloadIdentity.name,
			audiences: ['api://AzureADTokenExchange'],
			issuer: aksCluster.oidcIssuerProfile.apply((x) => x?.issuerURL ?? ''),
			subject: 'system:serviceaccount:azure-alb-system:alb-controller-sa',
		},
	)

	new azure.managedidentity.FederatedIdentityCredential(
		'external-secrets-federated-credential',
		{
			federatedIdentityCredentialResourceName:
				externalSecretsWorkloadIdentity.name,
			resourceGroupName: resourceGroup.name,
			resourceName: externalSecretsWorkloadIdentity.name,
			audiences: ['api://AzureADTokenExchange'],
			issuer: aksCluster.oidcIssuerProfile.apply((x) => x?.issuerURL ?? ''),
			subject: 'system:serviceaccount:external-secrets:external-secrets',
		},
	)

	new azure.authorization.RoleAssignment('aks-image-pull-role', {
		roleDefinitionId: `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/7f951dda-4ed3-4680-a7ca-43fe172d538d`,
		principalId: aksCluster.identityProfile.apply(
			(x) => x?.kubeletidentity?.objectId ?? '',
		),
		scope: registry.id,
		principalType: 'ServicePrincipal',
	})

	new command.local.Command(
		'refresh-local-kubeconfig',
		{
			create: pulumi.interpolate`az aks get-credentials --resource-group ${resourceGroup.name} --name ${aksCluster.name} --overwrite-existing`,
			update: pulumi.interpolate`az aks get-credentials --resource-group ${resourceGroup.name} --name ${aksCluster.name} --overwrite-existing`,
			delete: 'true',
		},
		{ dependsOn: [aksCluster] },
	)

	new azure.authorization.RoleAssignment('aks-network-contributor-role', {
		roleDefinitionId: `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/4d97b98b-1d4f-4787-a291-c67834d212e7`,
		principalId: aksCluster.identity.apply((x) => x?.principalId ?? ''),
		scope: resourceGroup.id,
		principalType: 'ServicePrincipal',
	})

	const creds = azure.containerservice.listManagedClusterUserCredentialsOutput({
		resourceGroupName: resourceGroup.name,
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
		ingressPublicIp,
		k8sProvider,
	}
}

function createFlux(
	k8sProvider: k8s.Provider,
	aksCluster: ManagedCluster,
	dependsOn: pulumi.Resource[] = [],
) {
	const fluxNamespace = new k8s.core.v1.Namespace(
		'flux-system-namespace',
		{
			metadata: {
				name: 'flux-system',
			},
		},
		{ provider: k8sProvider, dependsOn, deletedWith: aksCluster },
	)

	const fluxOperator = new k8s.helm.v3.Release(
		'flux-operator-helm-release',
		{
			name: 'flux-operator',
			chart: 'oci://ghcr.io/controlplaneio-fluxcd/charts/flux-operator',
			namespace: fluxNamespace.metadata.name,
		},
		{
			provider: k8sProvider,
			dependsOn: [fluxNamespace, ...dependsOn],
			deletedWith: aksCluster,
		},
	)

	new k8s.helm.v3.Release(
		'flux-instance-helm-release',
		{
			name: 'flux',
			chart: 'oci://ghcr.io/controlplaneio-fluxcd/charts/flux-instance',
			namespace: fluxNamespace.metadata.name,
			values: {
				instance: {
					sync: {
						kind: 'GitRepository',
						url: githubRepositoryUrl,
						ref: 'refs/heads/ci',
						path: 'packages/infra/manifests/clusters/staging',
					},
				},
			},
		},
		{
			provider: k8sProvider,
			dependsOn: [fluxOperator],
			deletedWith: aksCluster,
		},
	)

	return { aksCluster, k8sProvider }
}

const { aksCluster, ingressPublicIp, k8sProvider } = createKubernetes()
createFlux(k8sProvider, aksCluster)

// Outputs
export const aksClusterId = aksCluster.id
export const aksClusterName = aksCluster.name
export const nodeResourceGroup = aksCluster.nodeResourceGroup
export const ingressPublicIpAddress = ingressPublicIp.ipAddress
export const ingressPublicIpName = ingressPublicIp.name
export const oidcIssuerUrl = aksCluster.oidcIssuerProfile.apply(
	(profile) => profile?.issuerURL,
)
