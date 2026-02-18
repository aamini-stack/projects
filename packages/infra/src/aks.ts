import * as azure from '@pulumi/azure-native'
import * as containerservice from '@pulumi/azure-native/containerservice'
import * as command from '@pulumi/command'
import * as k8s from '@pulumi/kubernetes'
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
const getAksCredentials = new command.local.Command('get-aks-credentials', {
	create: pulumi.interpolate`az aks get-credentials --name ${aksCluster.name} --resource-group ${resourceGroupName} --overwrite-existing`,
})

// Static IP for Traefik (must be in node resource group for AKS LB)
const traefikIp = new azure.network.PublicIPAddress('traefik-ip', {
	resourceGroupName: aksCluster.nodeResourceGroup.apply((rg) => rg!),
	location: location,
	publicIPAllocationMethod: 'Static',
	sku: { name: 'Standard' },
})

const domain = 'ariaamini.com'

// DNS Zone
const dnsZone = new azure.dns.Zone('dns-zone', {
	zoneName: domain,
	resourceGroupName: resourceGroupName,
	location: 'global',
})

// Wildcard A record
new azure.dns.RecordSet('dns-wildcard', {
	zoneName: dnsZone.name,
	resourceGroupName: resourceGroupName,
	relativeRecordSetName: '*',
	recordType: 'A',
	ttl: 300,
	aRecords: [{ ipv4Address: traefikIp.ipAddress.apply((ip) => ip!) }],
})

// Root A record
new azure.dns.RecordSet('dns-root', {
	zoneName: dnsZone.name,
	resourceGroupName: resourceGroupName,
	relativeRecordSetName: '@',
	recordType: 'A',
	ttl: 300,
	aRecords: [{ ipv4Address: traefikIp.ipAddress.apply((ip) => ip!) }],
})

const creds = containerservice.listManagedClusterUserCredentialsOutput({
	resourceGroupName: resourceGroupName,
	resourceName: aksCluster.name,
})

const encoded = creds.kubeconfigs[0]?.value
export const kubeconfig = pulumi.secret(
	encoded?.apply((enc) => Buffer.from(enc, 'base64').toString()) ?? '',
)

// Workload identity for cert-manager
const certManagerIdentity = new azure.managedidentity.UserAssignedIdentity(
	'cert-manager-identity',
	{
		resourceGroupName: resourceGroupName,
		location: location,
	},
)

// DNS Zone Contributor role for cert-manager identity
new azure.authorization.RoleAssignment('cert-manager-dns-role', {
	roleDefinitionId: `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/befefa01-2a29-4197-83a8-272ff33ce314`,
	principalId: certManagerIdentity.principalId,
	scope: dnsZone.id,
	principalType: 'ServicePrincipal',
})

const oidcIssuerUrl = aksCluster.oidcIssuerProfile.apply(
	(p) => p?.issuerURL || '',
)

// Federated identity credential for cert-manager workload identity
new azure.managedidentity.FederatedIdentityCredential(
	'cert-manager-federated-credential',
	{
		federatedIdentityCredentialResourceName: certManagerIdentity.name,
		resourceGroupName: resourceGroupName,
		resourceName: certManagerIdentity.name,
		audiences: ['api://AzureADTokenExchange'],
		issuer: oidcIssuerUrl,
		subject: 'system:serviceaccount:networking:cert-manager',
	},
)

const k8sProvider = new k8s.Provider('k8s-provider', {
	kubeconfig: kubeconfig,
}, { dependsOn: [getAksCredentials] })

const fluxBootstrap = new command.local.Command(
	'flux-boostrap',
	{
		create: pulumi.interpolate`flux bootstrap github --owner=aamini-stack --repository=projects --branch=main --path=./packages/infra/manifests/gitops --personal --token-auth`,
		environment: {
			GITHUB_TOKEN: githubToken,
		},
	},
	{ dependsOn: [aksCluster, getAksCredentials] },
)

// Create networking-config ConfigMap directly in cluster after flux bootstrap creates the flux-system namespace.
// This is referenced by postBuild.substituteFrom in the system and helm Flux Kustomizations.
new k8s.core.v1.ConfigMap(
	'networking-config',
	{
		metadata: {
			name: 'networking-config',
			namespace: 'flux-system',
		},
		data: {
			TRAEFIK_PUBLIC_IP: traefikIp.ipAddress.apply((ip) => ip!),
			TRAEFIK_NODE_RESOURCE_GROUP: aksCluster.nodeResourceGroup.apply((rg) => rg!),
			CERT_MANAGER_CLIENT_ID: certManagerIdentity.clientId,
			AZURE_SUBSCRIPTION_ID: subscriptionId,
			AZURE_DNS_RESOURCE_GROUP: resourceGroupName,
		},
	},
	{ provider: k8sProvider, dependsOn: [fluxBootstrap] },
)

// Outputs
export const aksClusterId = aksCluster.id
export const aksClusterName = aksCluster.name
export const nodeResourceGroup = aksCluster.nodeResourceGroup
export const ip = traefikIp.ipAddress
