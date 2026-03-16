import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

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
	skipFinalSnapshot?: boolean
}

const config = new pulumi.Config()
const env = pulumi.getStack()

const pgConfig = config.requireObject<AwsPostgresConfig>('postgres')
const adminPassword = config.requireSecret('postgresAdminPassword')
const adminUser = config.get('postgresAdminUser') ?? 'pgadmin'
const port = pgConfig.port ?? 5432
const allowedCidrs = pgConfig.allowedCidrs ?? []
const identifier = `pg-aamini-${env}`

const defaultVpc = aws.ec2.getVpcOutput({ default: true })
const defaultSubnets = aws.ec2.getSubnetsOutput({
	filters: [{ name: 'vpc-id', values: [defaultVpc.id] }],
})

const securityGroup = new aws.ec2.SecurityGroup('postgres-sg', {
	description: 'PostgreSQL access for imdbgraph workloads',
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
	publiclyAccessible: pgConfig.publiclyAccessible ?? false,
	deletionProtection: pgConfig.deletionProtection ?? false,
	multiAz: pgConfig.multiAz ?? false,
	storageEncrypted: true,
	skipFinalSnapshot: pgConfig.skipFinalSnapshot ?? false,
	applyImmediately: true,
}

if (pgConfig.maxAllocatedStorage !== undefined) {
	instanceArgs.maxAllocatedStorage = pgConfig.maxAllocatedStorage
}

if (pgConfig.storageType !== undefined) {
	instanceArgs.storageType = pgConfig.storageType
}

const instance = new aws.rds.Instance('postgres', instanceArgs)

const postgresHost = instance.address.apply((host) => host ?? '')
const postgresPort = instance.port.apply((dbPort) => dbPort ?? port)
const postgresAdminUser = instance.username.apply((user) => user ?? adminUser)
const postgresAdminPassword = adminPassword
const postgresServerName = instance.identifier
const postgresInstanceIdentifier = instance.identifier

export {
	postgresHost,
	postgresPort,
	postgresAdminUser,
	postgresAdminPassword,
	postgresServerName,
	postgresInstanceIdentifier,
}
