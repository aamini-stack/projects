import * as azure from '@pulumi/azure-native'
import * as flux from '@worawat/flux'
import * as pulumi from '@pulumi/pulumi'

const config = new pulumi.Config('azure-native')
const fluxConfig = new pulumi.Config('flux')
const githubConfig = new pulumi.Config('github')

const branch = 'main'
const targetPath = fluxConfig.require('targetPath')
const token = githubConfig.requireSecret('token')

const subscriptionId = config.require('subscriptionId')
const azureResourceGroupName = config.require('resourceGroupName')

// Resource Group
const resourceGroup = new azure.resources.ResourceGroup('resourceGroup', {
	resourceGroupName: azureResourceGroupName,
})

// AKS Cluster
const aksCluster = new azure.containerservice.ManagedCluster('aksCluster', {
	resourceName: 'aks-imdbgraph',
	resourceGroupName: resourceGroup.name,
	dnsPrefix: 'imdbgraph-api',
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

// DNS Zone
new azure.network.Zone('dnsZone', {
	zoneName: 'staging.imdbgraph.org',
	location: 'global',
	resourceGroupName: resourceGroup.name,
})

// Creds
const workloadIdentity = new azure.managedidentity.UserAssignedIdentity(
	'workloadId',
	{
		resourceName: 'azure-alb-identity',
		location: resourceGroup.location,
		resourceGroupName: resourceGroup.name,
	},
)

const nodeResourceGroupId = aksCluster.nodeResourceGroup.apply(
	(nrg) => `subscriptions/${subscriptionId}/resourceGroups/${nrg}`,
)

new azure.authorization.RoleAssignment('readerRole', {
	roleDefinitionId: `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f606fba81ae7`,
	principalId: workloadIdentity.principalId,
	scope: nodeResourceGroupId,
	principalType: 'ServicePrincipal',
})

new azure.managedidentity.FederatedIdentityCredential('federatedId', {
	federatedIdentityCredentialResourceName: workloadIdentity.name,
	resourceGroupName: resourceGroup.name,
	resourceName: workloadIdentity.name,
	audiences: ['api://AzureADTokenExchange'],
	issuer: aksCluster.oidcIssuerProfile.apply((p) => p?.issuerURL || ''),
	subject: 'system:serviceaccount:azure-alb-system:alb-controller-sa',
})

// Gitops
const provider = new flux.Provider('fluxProvider', {
	kubernetes: {
		configPath: '~/.kube/config',
	},
	git: {
		url: `https://github.com/aamini-stack/projects.git`,
		branch: branch,
		http: {
			username: 'git',
			password: token,
		},
	},
})

const resource = new flux.FluxBootstrapGit(
	'flux',
	{
		path: targetPath,
		version: '2.7.0',
	},
	{
		provider: provider,
		dependsOn: [aksCluster],
	},
)

// Storage Account for Ducky MOT Images
const storageAccount = new azure.storage.StorageAccount('duckyMotStorage', {
	accountName: 'duckymotimages', // Must be globally unique, lowercase, 3-24 chars
	resourceGroupName: resourceGroup.name,
	location: resourceGroup.location,
	sku: {
		name: 'Standard_LRS', // Locally redundant storage
	},
	kind: 'StorageV2',
	allowBlobPublicAccess: true,
	enableHttpsTrafficOnly: true,
	minimumTlsVersion: 'TLS1_2',
})

// Blob Container for images
const imageContainer = new azure.storage.BlobContainer('images', {
	containerName: 'images',
	accountName: storageAccount.name,
	resourceGroupName: resourceGroup.name,
	publicAccess: 'Blob', // Allow public read access to blobs
})

// Enable static website hosting (optional, useful for serving images)
const staticWebsite = new azure.storage.StorageAccountStaticWebsite(
	'staticWebsite',
	{
		accountName: storageAccount.name,
		resourceGroupName: resourceGroup.name,
		indexDocument: 'index.html',
		error404Document: '404.html',
	},
)

// Configure CORS for the blob service (allows web access)
new azure.storage.BlobServiceProperties('blobServiceProperties', {
	accountName: storageAccount.name,
	resourceGroupName: resourceGroup.name,
	cors: {
		corsRules: [
			{
				allowedOrigins: ['*'], // Update this to specific domains in production
				allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
				allowedHeaders: ['*'],
				exposedHeaders: ['*'],
				maxAgeInSeconds: 3600,
			},
		],
	},
})

// Outputs
export const bootstrapId = resource.id

const creds = azure.containerservice.listManagedClusterUserCredentialsOutput({
	resourceGroupName: resourceGroup.name,
	resourceName: aksCluster.name,
})
const encoded = creds.kubeconfigs[0]?.value
export const kubeconfig = pulumi.secret(
	encoded?.apply((enc) => Buffer.from(enc, 'base64').toString()) ?? '',
)

// Storage outputs
export const storageAccountName = storageAccount.name
export const storageAccountPrimaryEndpoint = storageAccount.primaryEndpoints.apply(
	(endpoints) => endpoints?.blob,
)
export const imageContainerUrl = pulumi.interpolate`${storageAccount.primaryEndpoints.apply((e) => e?.blob)}${imageContainer.name}/`
export const staticWebsiteUrl = storageAccount.primaryEndpoints.apply(
	(endpoints) => endpoints?.web,
)
