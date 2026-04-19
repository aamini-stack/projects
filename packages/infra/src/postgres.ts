import * as azure from '@pulumi/azure-native'
import * as pulumi from '@pulumi/pulumi'
import { resourceGroup } from './resource-groups'
import * as types from '@pulumi/azure-native/types/enums'

interface PostgresConfig {
	skuName: string
	skuTier: azure.types.enums.dbforpostgresql.SkuTier
	storageSizeGb: number
	backupRetentionDays: number
	geoRedundantBackup: types.dbforpostgresql.GeographicallyRedundantBackup
}

const azureConfig = new pulumi.Config('azure-native')
const location = azureConfig.require('location')
const currentClient = azure.authorization.getClientConfigOutput()

const config = new pulumi.Config()
const dbSpecs = config.requireObject<PostgresConfig>('dbSpecs')
const serverName = `pg-aamini-${pulumi.getStack()}`

const server = new azure.dbforpostgresql.Server(serverName, {
	serverName,
	resourceGroupName: resourceGroup.name,
	location,
	createMode: 'Default',
	version: '16',
	authConfig: {
		activeDirectoryAuth: 'Enabled',
		passwordAuth: 'Disabled',
		tenantId: currentClient.tenantId,
	},
	sku: {
		name: dbSpecs.skuName,
		tier: dbSpecs.skuTier,
	},
	storage: {
		storageSizeGB: dbSpecs.storageSizeGb,
		autoGrow: 'Disabled',
		type: 'Premium_LRS',
	},
	backup: {
		backupRetentionDays: dbSpecs.backupRetentionDays,
		geoRedundantBackup: dbSpecs.geoRedundantBackup,
	},
	highAvailability: {
		mode: 'Disabled',
	},
	network: {
		publicNetworkAccess: 'Enabled',
	},
})

const allowAllFirewallRule = new azure.dbforpostgresql.FirewallRule(
	'allow-all',
	{
		resourceGroupName: resourceGroup.name,
		serverName: server.name,
		startIpAddress: '0.0.0.0',
		endIpAddress: '255.255.255.255',
	},
	{ deletedWith: server },
)

new azure.dbforpostgresql.Configuration(
	'pg-extensions',
	{
		resourceGroupName: resourceGroup.name,
		serverName: server.name,
		configurationName: 'azure.extensions',
		value: 'PG_TRGM',
		source: 'user-override',
	},
	{
		deletedWith: server,
		dependsOn: [allowAllFirewallRule],
	},
)

// Exports for apps to consume
export const postgresHost = server.fullyQualifiedDomainName
export const postgresAdminUser = server
export const postgresServerName = server.name
