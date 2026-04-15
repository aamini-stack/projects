import * as azure from '@pulumi/azure-native'
import * as postgresql from '@pulumi/postgresql'
import * as pulumi from '@pulumi/pulumi'

export interface AppDatabaseArgs {
	name: pulumi.Input<string>
	serverResourceGroupName: pulumi.Input<string>
	serverName: pulumi.Input<string>
	serverHost: pulumi.Input<string>
	adminUser: pulumi.Input<string>
	adminPassword: pulumi.Input<string>
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

		const role = new postgresql.Role(
			`${name}-db-role`,
			{
				name: appUserName,
				login: true,
				password: args.userPassword,
			},
			{ parent: this, provider: pgProvider },
		)

		// Create the database after the app role so destroy tears down the database first.
		const database = new azure.dbforpostgresql.Database(
			`${name}-db`,
			{
				resourceGroupName: args.serverResourceGroupName,
				serverName: args.serverName,
				databaseName: args.name,
				charset: args.charset ?? 'UTF8',
				collation: args.collation ?? 'en_US.utf8',
			},
			{ parent: this, dependsOn: [role] },
		)

		new postgresql.Grant(
			`${name}-db-grant`,
			{
				role: role.name,
				database: database.name,
				objectType: 'database',
				privileges: ['ALL'],
			},
			{ parent: this, provider: pgProvider, dependsOn: [role, database] },
		)

		// Grant all privileges on the public schema to the app user
		new postgresql.Grant(
			`${name}-schema-grant`,
			{
				role: role.name,
				database: database.name,
				schema: 'public',
				objectType: 'schema',
				privileges: ['ALL'],
			},
			{ parent: this, provider: pgProvider, dependsOn: [role, database] },
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
			{
				parent: this,
				provider: dbProvider,
				dependsOn: [database],
			},
		)

		this.databaseName = database.name
		this.userName = appUserName
		this.userPassword = pulumi.secret(args.userPassword)

		this.registerOutputs({
			databaseName: this.databaseName,
			userName: this.userName,
			userPassword: this.userPassword,
		})
	}
}
