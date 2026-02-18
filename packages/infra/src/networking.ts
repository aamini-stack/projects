import * as azure from '@pulumi/azure-native'
import * as command from '@pulumi/command'
import * as pulumi from '@pulumi/pulumi'
import { getAksCredentials, nodeResourceGroup, oidcIssuerUrl } from './aks'
import { resourceGroupName } from './resource-group'

const config = new pulumi.Config('azure-native')
const subscriptionId = config.require('subscriptionId')
const location = config.require('location')

const domain = 'ariaamini.com'

// DNS Zone
const dnsZone = new azure.dns.Zone('dns-zone', {
	zoneName: domain,
	resourceGroupName: resourceGroupName,
	location: 'global',
})

// Static IP for Traefik (must be in node resource group for AKS LB)
const traefikIp = new azure.network.PublicIPAddress('traefik-ip', {
	resourceGroupName: nodeResourceGroup.apply((rg) => rg!),
	location: location,
	publicIPAllocationMethod: 'Static',
	sku: { name: 'Standard' },
})

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

// Sync networking outputs to a ConfigMap for Flux postBuild substitution
new command.local.Command(
	'networking-configmap',
	{
		create: pulumi.interpolate`kubectl create configmap networking-config --namespace=flux-system --from-literal=TRAEFIK_PUBLIC_IP=${traefikIp.ipAddress} --from-literal=TRAEFIK_NODE_RESOURCE_GROUP=${nodeResourceGroup} --from-literal=CERT_MANAGER_CLIENT_ID=${certManagerIdentity.clientId} --from-literal=AZURE_SUBSCRIPTION_ID=${subscriptionId} --from-literal=AZURE_DNS_RESOURCE_GROUP=${resourceGroupName} --dry-run=client -o yaml | kubectl apply -f -`,
		triggers: [
			traefikIp.ipAddress,
			certManagerIdentity.clientId,
			nodeResourceGroup,
		],
	},
	{ dependsOn: [getAksCredentials, traefikIp, certManagerIdentity] },
)

// Outputs
export const dnsZoneNameServers = dnsZone.nameServers
export const traefikPublicIp = traefikIp.ipAddress
export const certManagerClientId = certManagerIdentity.clientId
