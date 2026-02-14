import * as azure from '@pulumi/azure-native'
import * as pulumi from '@pulumi/pulumi'
import * as random from '@pulumi/random'

interface PostgresConfig {
	skuName: string
	skuTier: string
	storageSizeGb: number
	backupRetentionDays: number
	geoRedundantBackup: string
}

const config = new pulumi.Config()
const pgConfig = config.requireObject<PostgresConfig>('postgres')
const env = pulumi.getStack()
const azureConfig = new pulumi.Config('azure-native')

// Generate admin password
const adminPassword = new random.RandomPassword('pg-admin-password', {
	length: 32,
	special: true,
})

// Create resource group
const resourceGroupName = config.require('resourceGroup')
const resourceGroup = new azure.resources.ResourceGroup(resourceGroupName, {
	resourceGroupName,
	location: azureConfig.require('location'),
})

// PostgreSQL Flexible Server
const serverName = `pg-aamini-${env}`
const server = new azure.dbforpostgresql.Server(serverName, {
	serverName,
	resourceGroupName: resourceGroup.name,
	location: azureConfig.require('location'),
	version: '16',
	administratorLogin: 'pgadmin',
	administratorLoginPassword: adminPassword.result,
	sku: {
		name: pgConfig.skuName,
		tier: pgConfig.skuTier,
	},
	storage: {
		storageSizeGB: pgConfig.storageSizeGb,
	},
	backup: {
		backupRetentionDays: pgConfig.backupRetentionDays,
		geoRedundantBackup: pgConfig.geoRedundantBackup,
	},
})

// Allow-list PostgreSQL extensions
new azure.dbforpostgresql.Configuration('pg-extensions', {
	resourceGroupName: resourceGroup.name,
	serverName: server.name,
	configurationName: 'azure.extensions',
	value: 'PG_TRGM',
	source: 'user-override',
})

// Allow Azure services to connect
new azure.dbforpostgresql.FirewallRule('allow-azure-services', {
	resourceGroupName: resourceGroup.name,
	serverName: server.name,
	startIpAddress: '0.0.0.0',
	endIpAddress: '0.0.0.0',
})

// Allow all public IPs to connect
new azure.dbforpostgresql.FirewallRule('allow-all', {
	resourceGroupName: resourceGroup.name,
	serverName: server.name,
	startIpAddress: '0.0.0.0',
	endIpAddress: '255.255.255.255',
})

// Exports for apps to consume
export const postgresHost = server.fullyQualifiedDomainName
export const postgresAdminUser = server.administratorLogin
export const postgresAdminPassword = pulumi.secret(adminPassword.result)
export const postgresPort = 5432
export const postgresResourceGroup = resourceGroup.name
export const postgresServerName = server.name
