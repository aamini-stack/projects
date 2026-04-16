import * as azure from '@pulumi/azure-native'
import * as pulumi from '@pulumi/pulumi'

import { resourceGroup } from './resource-groups'

interface PostgresConfig {
	skuName: string
	skuTier: string
	storageSizeGb: number
	backupRetentionDays: number
	geoRedundantBackup: string
}

const config = new pulumi.Config()
const azureConfig = new pulumi.Config('azure-native')

const serverName = `pg-aamini-${pulumi.getStack()}`
const dbSpecs = config.requireObject<PostgresConfig>('dbSpecs')
const location = azureConfig.require('location')
const dbPassword = config.requireSecret('dbPassword')

const server = new azure.dbforpostgresql.Server(serverName, {
	serverName,
	resourceGroupName: resourceGroup.name,
	location: location,
	version: '16',
	administratorLogin: 'pgadmin',
	administratorLoginPassword: dbPassword,
	sku: {
		name: dbSpecs.skuName,
		tier: dbSpecs.skuTier,
	},
	storage: {
		storageSizeGB: dbSpecs.storageSizeGb,
	},
	backup: {
		backupRetentionDays: dbSpecs.backupRetentionDays,
		geoRedundantBackup: dbSpecs.geoRedundantBackup,
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
	{ deletedWith: server, dependsOn: allowAllFirewallRule },
)

// Exports for apps to consume
export const postgresHost = server.fullyQualifiedDomainName
export const postgresAdminUser = server.administratorLogin
export const postgresAdminPassword = dbPassword
export const postgresServerName = server.name
