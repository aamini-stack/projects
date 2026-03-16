import * as azure from '@pulumi/azure-native'
import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

interface AzurePostgresConfig {
	skuName: string
	skuTier: string
	storageSizeGb: number
	backupRetentionDays: number
	geoRedundantBackup: string
}

interface AwsPostgresConfig {
	instanceClass: string
	allocatedStorage: number
	maxAllocatedStorage?: number
	backupRetentionDays?: number
	engineVersion?: string
	storageType?: string
	publiclyAccessible?: boolean
	deletionProtection?: boolean
	multiAz?: boolean
	port?: number
	allowedCidrs?: string[]
}

const config = new pulumi.Config()
const env = pulumi.getStack()
const provider =
	config.get('postgresProvider') ?? (env === 'staging' ? 'azure' : 'aws')

let postgresHost: pulumi.Output<string>
let postgresPort: pulumi.Output<number>
let postgresAdminUser: pulumi.Output<string>
let postgresAdminPassword: pulumi.Output<string>
let postgresServerName: pulumi.Output<string>
let postgresInstanceIdentifier: pulumi.Output<string>

if (provider === 'azure') {
	const pgConfig = config.requireObject<AzurePostgresConfig>('postgres')
	const azureConfig = new pulumi.Config('azure-native')
	const location = azureConfig.require('location')
	const resourceGroupName = azureConfig.require('resourceGroup')
	const adminPassword = config.requireSecret('postgresAdminPassword')

	const serverName = `pg-aamini-${env}`
	const server = new azure.dbforpostgresql.Server(serverName, {
		serverName,
		resourceGroupName: resourceGroupName,
		location: location,
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

	const allowAzureServices = new azure.dbforpostgresql.FirewallRule(
		'allow-azure-services',
		{
			resourceGroupName: resourceGroupName,
			serverName: server.name,
			startIpAddress: '0.0.0.0',
			endIpAddress: '0.0.0.0',
		},
		{ dependsOn: [server] },
	)

	const allowAll = new azure.dbforpostgresql.FirewallRule(
		'allow-all',
		{
			resourceGroupName: resourceGroupName,
			serverName: server.name,
			startIpAddress: '0.0.0.0',
			endIpAddress: '255.255.255.255',
		},
		{ dependsOn: [allowAzureServices] },
	)

	new azure.dbforpostgresql.Configuration(
		'pg-extensions',
		{
			resourceGroupName: resourceGroupName,
			serverName: server.name,
			configurationName: 'azure.extensions',
			value: 'PG_TRGM',
			source: 'user-override',
		},
		{ dependsOn: [allowAll] },
	)

	postgresHost = server.fullyQualifiedDomainName.apply((host) => host ?? '')
	postgresPort = pulumi.output(5432)
	postgresAdminUser = server.administratorLogin.apply(
		(user) => user ?? 'pgadmin',
	)
	postgresAdminPassword = adminPassword
	postgresServerName = server.name
	postgresInstanceIdentifier = server.name
} else {
	const pgConfig = config.requireObject<AwsPostgresConfig>('postgres')
	const adminPassword = config.requireSecret('postgresAdminPassword')
	const adminUser = config.get('postgresAdminUser') ?? 'pgadmin'
	const port = pgConfig.port ?? 5432
	const allowedCidrs = pgConfig.allowedCidrs ?? ['0.0.0.0/0']
	const identifier = `pg-aamini-${env}`

	const defaultVpc = aws.ec2.getVpcOutput({ default: true })
	const defaultSubnets = aws.ec2.getSubnetsOutput({
		filters: [{ name: 'vpc-id', values: [defaultVpc.id] }],
	})

	const securityGroup = new aws.ec2.SecurityGroup('postgres-sg', {
		description: 'PostgreSQL access for imdbgraph production path',
		vpcId: defaultVpc.id,
		ingress: [
			{
				protocol: 'tcp',
				fromPort: port,
				toPort: port,
				cidrBlocks: allowedCidrs,
			},
		],
		egress: [
			{
				protocol: '-1',
				fromPort: 0,
				toPort: 0,
				cidrBlocks: ['0.0.0.0/0'],
			},
		],
	})

	const subnetGroup = new aws.rds.SubnetGroup('postgres-subnet-group', {
		subnetIds: defaultSubnets.ids,
		tags: {
			Name: `${identifier}-subnets`,
		},
	})

	const instanceArgs: aws.rds.InstanceArgs = {
		identifier,
		engine: 'postgres',
		engineVersion: pgConfig.engineVersion ?? '16.3',
		instanceClass: pgConfig.instanceClass,
		allocatedStorage: pgConfig.allocatedStorage,
		backupRetentionPeriod: pgConfig.backupRetentionDays ?? 7,
		username: adminUser,
		password: adminPassword,
		port,
		dbSubnetGroupName: subnetGroup.name,
		vpcSecurityGroupIds: [securityGroup.id],
		publiclyAccessible: pgConfig.publiclyAccessible ?? true,
		deletionProtection: pgConfig.deletionProtection ?? false,
		multiAz: pgConfig.multiAz ?? false,
		storageEncrypted: true,
		skipFinalSnapshot: true,
		applyImmediately: true,
	}

	if (pgConfig.maxAllocatedStorage !== undefined) {
		instanceArgs.maxAllocatedStorage = pgConfig.maxAllocatedStorage
	}

	if (pgConfig.storageType !== undefined) {
		instanceArgs.storageType = pgConfig.storageType
	}

	const instance = new aws.rds.Instance('postgres', instanceArgs)

	postgresHost = instance.address.apply((host) => host ?? '')
	postgresPort = instance.port.apply((dbPort) => dbPort ?? port)
	postgresAdminUser = instance.username.apply((user) => user ?? adminUser)
	postgresAdminPassword = adminPassword
	postgresServerName = instance.identifier
	postgresInstanceIdentifier = instance.identifier
}

export {
	postgresHost,
	postgresPort,
	postgresAdminUser,
	postgresAdminPassword,
	postgresServerName,
	postgresInstanceIdentifier,
}
