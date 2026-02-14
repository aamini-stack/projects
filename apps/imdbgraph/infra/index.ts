import { AppDatabase } from '@aamini/infra/src/components'
import * as pulumi from '@pulumi/pulumi'

// Reference the global infrastructure stack using the current stack's environment name
const currentStack = pulumi.getStack()
const globalStack = new pulumi.StackReference(
	`aamini11/aamini-infra/${currentStack}`,
)

// Get server details from global stack
const serverResourceGroup = globalStack.getOutput('postgresResourceGroup')
const serverName = globalStack.getOutput('postgresServerName')
const dbHost = globalStack.getOutput('db').apply((db: any) => db.host)

// Create app database using shared component
const appDb = new AppDatabase('imdbgraph', {
	name: 'imdbgraph',
	serverResourceGroupName: serverResourceGroup,
	serverName: serverName,
	serverHost: dbHost,
	adminUser: globalStack.getOutput('db').apply((db: any) => db.adminUser),
	adminPassword: globalStack
		.getOutput('db')
		.apply((db: any) => db.adminPassword),
})

// Export connection string for app to use
export const databaseUrl = pulumi.interpolate`postgresql://${appDb.userName}:${appDb.userPassword}@${dbHost}:5432/${appDb.databaseName}?sslmode=require`
