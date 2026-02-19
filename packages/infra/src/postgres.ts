import * as azure from '@pulumi/azure-native'
import * as pulumi from '@pulumi/pulumi'
import { resourceGroupName } from './resource-group'

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

const adminPassword = config.requireSecret('postgresAdminPassword')

// PostgreSQL Flexible Server
const serverName = `pg-aamini-${env}`
const server = new azure.dbforpostgresql.Server(serverName, {
	serverName,
	resourceGroupName: resourceGroupName,
	location: azureConfig.require('location'),
	version: '16',
	administratorLogin: 'pgadmin',
	administratorLoginPassword: adminPassword,
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
new azure.dbforpostgresql.Configuration(
	'pg-extensions',
	{
		resourceGroupName: resourceGroupName,
		serverName: server.name,
		configurationName: 'azure.extensions',
		value: 'PG_TRGM',
		source: 'user-override',
	},
	{ dependsOn: [server] },
)

// Allow Azure services to connect
new azure.dbforpostgresql.FirewallRule('allow-azure-services', {
	resourceGroupName: resourceGroupName,
	serverName: server.name,
	startIpAddress: '0.0.0.0',
	endIpAddress: '0.0.0.0',
})

// Allow all public IPs to connect
new azure.dbforpostgresql.FirewallRule('allow-all', {
	resourceGroupName: resourceGroupName,
	serverName: server.name,
	startIpAddress: '0.0.0.0',
	endIpAddress: '255.255.255.255',
})

// Exports for apps to consume
export const postgresHost = server.fullyQualifiedDomainName
export const postgresAdminUser = server.administratorLogin
export const postgresAdminPassword = adminPassword
export const postgresServerName = server.name
