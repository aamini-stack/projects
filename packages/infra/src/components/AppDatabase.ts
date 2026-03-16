import * as azure from '@pulumi/azure-native'
import * as postgresql from '@pulumi/postgresql'
import * as pulumi from '@pulumi/pulumi'

export interface AppDatabaseArgs {
	/** Database name (e.g., "imdbgraph") */
	name: pulumi.Input<string>
	/** Server resource group name (required for Azure database resource path) */
	serverResourceGroupName?: pulumi.Input<string>
	/** Server name (required for Azure database resource path) */
	serverName?: pulumi.Input<string>
	/** FQDN of the PostgreSQL server */
	serverHost: pulumi.Input<string>
	/** PostgreSQL server port (default: 5432) */
	serverPort?: pulumi.Input<number>
	/** Admin username for the PostgreSQL server */
	adminUser: pulumi.Input<string>
	/** Admin password for the PostgreSQL server */
	adminPassword: pulumi.Input<string>
	/** Charset (default: UTF8) */
	charset?: pulumi.Input<string>
	/** Collation (default: en_US.utf8) */
	collation?: pulumi.Input<string>
	/** App user password */
	userPassword: pulumi.Input<string>
}

export class AppDatabase extends pulumi.ComponentResource {
	public readonly databaseName: pulumi.Output<string>
	public readonly userName: pulumi.Output<string>
	public readonly userPassword: pulumi.Output<string>

	constructor(
		name: string,
		args: AppDatabaseArgs,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super('aamini:infra:AppDatabase', name, {}, opts)

		// Create a PostgreSQL provider using admin credentials
		const providerConfig: postgresql.ProviderArgs = {
			host: args.serverHost,
			username: args.adminUser,
			password: args.adminPassword,
			sslmode: 'require',
			superuser: false,
		}

		if (args.serverPort !== undefined) {
			providerConfig.port = args.serverPort
		}

		const pgProvider = new postgresql.Provider(
			`${name}-pg-provider`,
			providerConfig,
			{ parent: this },
		)

		const appUserName = pulumi.output(args.name).apply((n) => `${n}_user`)

		// Create the PostgreSQL role for the app user
		const role = new postgresql.Role(
			`${name}-db-role`,
			{
				name: appUserName,
				login: true,
				password: args.userPassword,
			},
			{ parent: this, provider: pgProvider },
		)

		const useAzureDatabaseResource =
			args.serverResourceGroupName !== undefined &&
			args.serverName !== undefined

		let databaseName: pulumi.Output<string>
		let databaseDependency: pulumi.Resource

		if (useAzureDatabaseResource) {
			const azureDatabase = new azure.dbforpostgresql.Database(
				`${name}-db`,
				{
					resourceGroupName: args.serverResourceGroupName!,
					serverName: args.serverName!,
					databaseName: args.name,
					charset: args.charset ?? 'UTF8',
					collation: args.collation ?? 'en_US.utf8',
				},
				{ parent: this, dependsOn: [role] },
			)

			databaseName = azureDatabase.name
			databaseDependency = azureDatabase
		} else {
			const postgresDatabase = new postgresql.Database(
				`${name}-db`,
				{
					name: args.name,
					owner: role.name,
					encoding: args.charset ?? 'UTF8',
					lcCollate: args.collation ?? 'en_US.utf8',
					lcCtype: args.collation ?? 'en_US.utf8',
				},
				{ parent: this, provider: pgProvider, dependsOn: [role] },
			)

			databaseName = postgresDatabase.name
			databaseDependency = postgresDatabase
		}

		// Grant all privileges on the database to the app user
		new postgresql.Grant(
			`${name}-db-grant`,
			{
				role: role.name,
				database: databaseName,
				objectType: 'database',
				privileges: ['ALL'],
			},
			{
				parent: this,
				provider: pgProvider,
				dependsOn: [role, databaseDependency],
			},
		)

		// Grant all privileges on the public schema to the app user
		new postgresql.Grant(
			`${name}-schema-grant`,
			{
				role: role.name,
				database: databaseName,
				schema: 'public',
				objectType: 'schema',
				privileges: ['ALL'],
			},
			{
				parent: this,
				provider: pgProvider,
				dependsOn: [role, databaseDependency],
			},
		)

		// Enable pg_trgm extension (allow-listed at the server level)
		const dbProviderConfig: postgresql.ProviderArgs = {
			host: args.serverHost,
			username: args.adminUser,
			password: args.adminPassword,
			database: databaseName,
			sslmode: 'require',
			superuser: false,
		}

		if (args.serverPort !== undefined) {
			dbProviderConfig.port = args.serverPort
		}

		const dbProvider = new postgresql.Provider(
			`${name}-pg-db-provider`,
			dbProviderConfig,
			{ parent: this },
		)

		new postgresql.Extension(
			`${name}-ext-pg_trgm`,
			{ name: 'pg_trgm' },
			{
				parent: this,
				provider: dbProvider,
				dependsOn: [databaseDependency],
			},
		)

		this.databaseName = databaseName
		this.userName = appUserName
		this.userPassword = pulumi.secret(args.userPassword)

		this.registerOutputs({
			databaseName: this.databaseName,
			userName: this.userName,
			userPassword: this.userPassword,
		})
	}
}
