import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'
import * as random from '@pulumi/random'

type PostgresConfig = {
	instanceClass: string
	allocatedStorage: number
	maxAllocatedStorage: number
	backupRetentionDays: number
	engineVersion: string
	storageType: string
	publiclyAccessible: boolean
	deletionProtection: boolean
	multiAz: boolean
	allowedCidrs: string[]
}

const config = new pulumi.Config()
const postgresConfig = config.requireObject<PostgresConfig>('postgres')
const env = pulumi.getStack()

const adminPassword = config.requireSecret('postgresAdminPassword')
const adminUser = 'pgadmin'
const port = 5432
const identifier = `pg-aamini-${env}`
const finalSnapshotSuffix = new random.RandomString(
	'postgres-final-snapshot-suffix',
	{
		length: 8,
		special: false,
		upper: false,
	},
)

const defaultVpc = aws.ec2.getVpcOutput({ default: true })
const defaultSubnets = aws.ec2.getSubnetsOutput({
	filters: [{ name: 'vpc-id', values: [defaultVpc.id] }],
})

const securityGroup = new aws.ec2.SecurityGroup('postgres-sg', {
	description: 'PostgreSQL access for platform workloads',
	vpcId: defaultVpc.id,
	ingress: [
		{
			protocol: 'tcp',
			fromPort: port,
			toPort: port,
			cidrBlocks: postgresConfig.allowedCidrs,
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

const instance = new aws.rds.Instance('postgres', {
	identifier,
	engine: 'postgres',
	engineVersion: postgresConfig.engineVersion,
	instanceClass: postgresConfig.instanceClass,
	allocatedStorage: postgresConfig.allocatedStorage,
	maxAllocatedStorage: postgresConfig.maxAllocatedStorage,
	backupRetentionPeriod: postgresConfig.backupRetentionDays,
	username: adminUser,
	password: adminPassword,
	port,
	dbSubnetGroupName: subnetGroup.name,
	vpcSecurityGroupIds: [securityGroup.id],
	publiclyAccessible: postgresConfig.publiclyAccessible,
	deletionProtection: postgresConfig.deletionProtection,
	multiAz: postgresConfig.multiAz,
	storageType: postgresConfig.storageType,
	storageEncrypted: true,
	skipFinalSnapshot: false,
	finalSnapshotIdentifier: pulumi.interpolate`${identifier}-snapshot-${finalSnapshotSuffix.result}`,
	applyImmediately: true,
})

export const postgres = {
	host: instance.address,
	port: instance.port,
	adminUser: instance.username,
	adminPassword: adminPassword,
	serverName: instance.identifier,
}
