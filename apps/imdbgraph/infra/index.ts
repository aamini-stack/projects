import { AppDatabase } from '@aamini/infra/src/components'
import * as pulumi from '@pulumi/pulumi'

const config = new pulumi.Config()
const dbPassword = config.requireSecret('dbPassword')

// Reference the global infrastructure stack using the current stack's environment name
const currentStack = pulumi.getStack()
const globalStack = new pulumi.StackReference(
	`aamini11/aamini-infra/${currentStack}`,
)

// Get server details from global stack
const serverResourceGroup = globalStack
	.getOutput('resourceGroup')
	.apply((rg: any) => rg.resourceGroupName)
const serverName = globalStack
	.getOutput('postgres')
	.apply((pg: any) => pg.postgresServerName)
const dbHost = globalStack
	.getOutput('postgres')
	.apply((pg: any) => pg.postgresHost)

// Create app database using shared component
const appDb = new AppDatabase('imdbgraph', {
	name: 'imdbgraph',
	serverResourceGroupName: serverResourceGroup,
	serverName: serverName,
	serverHost: dbHost,
	adminUser: globalStack
		.getOutput('postgres')
		.apply((pg: any) => pg.postgresAdminUser),
	adminPassword: globalStack
		.getOutput('postgres')
		.apply((pg: any) => pg.postgresAdminPassword),
	userPassword: dbPassword,
})

// Export connection string for app to use
export const databaseUrl = pulumi.interpolate`postgresql://${appDb.userName}:${appDb.userPassword}@${dbHost}:5432/${appDb.databaseName}?sslmode=require`
