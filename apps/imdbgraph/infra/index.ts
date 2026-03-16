import { AppDatabase } from '@aamini/infra/src/components'
import * as pulumi from '@pulumi/pulumi'

interface PostgresStackOutput {
	postgresHost: string
	postgresPort?: number
	postgresAdminUser: string
	postgresAdminPassword: string
}

const config = new pulumi.Config()
const dbPassword = config.requireSecret('dbPassword')

// Reference the global infrastructure stack using the current stack's environment name
const currentStack = pulumi.getStack()
const globalStack = new pulumi.StackReference(
	`aamini11/aamini-infra/${currentStack}`,
)

const postgres = globalStack.getOutput(
	'postgres',
) as pulumi.Output<PostgresStackOutput>
const dbHost = postgres.apply((pg) => pg.postgresHost)
const dbPort = postgres.apply((pg) => pg.postgresPort ?? 5432)

const appDb = new AppDatabase('imdbgraph', {
	name: 'imdbgraph',
	serverHost: dbHost,
	serverPort: dbPort,
	adminUser: postgres.apply((pg) => pg.postgresAdminUser),
	adminPassword: postgres.apply((pg) => pg.postgresAdminPassword),
	userPassword: dbPassword,
})

// Export connection string for app to use
export const databaseUrl = pulumi.interpolate`postgresql://${appDb.userName}:${appDb.userPassword}@${dbHost}:${dbPort}/${appDb.databaseName}?sslmode=require`
