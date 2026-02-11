import * as azure from '@pulumi/azure-native'
import * as postgresql from '@pulumi/postgresql'
import * as pulumi from '@pulumi/pulumi'
import * as random from '@pulumi/random'

export interface AppDatabaseArgs {
	/** Database name (e.g., "imdbgraph") */
	name: pulumi.Input<string>
	/** Server resource group name */
	serverResourceGroupName: pulumi.Input<string>
	/** Server name */
	serverName: pulumi.Input<string>
	/** FQDN of the PostgreSQL server */
	serverHost: pulumi.Input<string>
	/** Admin username for the PostgreSQL server */
	adminUser: pulumi.Input<string>
	/** Admin password for the PostgreSQL server */
	adminPassword: pulumi.Input<string>
	/** Charset (default: UTF8) */
	charset?: pulumi.Input<string>
	/** Collation (default: en_US.utf8) */
	collation?: pulumi.Input<string>
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

		// Create the database
		const database = new azure.dbforpostgresql.Database(
			`${name}-db`,
			{
				resourceGroupName: args.serverResourceGroupName,
				serverName: args.serverName,
				databaseName: args.name,
				charset: args.charset ?? 'UTF8',
				collation: args.collation ?? 'en_US.utf8',
			},
			{ parent: this },
		)

		// Generate app-specific user password
		const userPassword = new random.RandomPassword(
			`${name}-db-password`,
			{
				length: 32,
				special: false,
			},
			{ parent: this },
		)

		// Create a PostgreSQL provider using admin credentials
		const pgProvider = new postgresql.Provider(
			`${name}-pg-provider`,
			{
				host: args.serverHost,
				username: args.adminUser,
				password: args.adminPassword,
				sslmode: 'require',
				superuser: false,
			},
			{ parent: this },
		)

		const appUserName = pulumi.output(args.name).apply((n) => `${n}_user`)

		// Create the PostgreSQL role for the app user
		const role = new postgresql.Role(
			`${name}-db-role`,
			{
				name: appUserName,
				login: true,
				password: userPassword.result,
			},
			{ parent: this, provider: pgProvider, dependsOn: [database] },
		)

		// Grant all privileges on the database to the app user
		new postgresql.Grant(
			`${name}-db-grant`,
			{
				role: role.name,
				database: database.name,
				objectType: 'database',
				privileges: ['ALL'],
			},
			{ parent: this, provider: pgProvider, dependsOn: [role] },
		)

		// Enable pg_trgm extension (allow-listed at the server level)
		const dbProvider = new postgresql.Provider(
			`${name}-pg-db-provider`,
			{
				host: args.serverHost,
				username: args.adminUser,
				password: args.adminPassword,
				database: args.name,
				sslmode: 'require',
				superuser: false,
			},
			{ parent: this },
		)

		new postgresql.Extension(
			`${name}-ext-pg_trgm`,
			{ name: 'pg_trgm' },
			{ parent: this, provider: dbProvider, dependsOn: [database] },
		)

		this.databaseName = database.name
		this.userName = appUserName
		this.userPassword = pulumi.secret(userPassword.result)

		this.registerOutputs({
			databaseName: this.databaseName,
			userName: this.userName,
			userPassword: this.userPassword,
		})
	}
}
