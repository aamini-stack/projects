import * as postgresql from '@pulumi/postgresql'
import * as pulumi from '@pulumi/pulumi'

export interface AppDatabaseArgs {
	name: pulumi.Input<string>
	serverHost: pulumi.Input<string>
	serverPort?: pulumi.Input<number>
	adminUser: pulumi.Input<string>
	adminPassword: pulumi.Input<string>
	charset?: pulumi.Input<string>
	collation?: pulumi.Input<string>
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

		const role = new postgresql.Role(
			`${name}-db-role`,
			{
				name: appUserName,
				login: true,
				password: args.userPassword,
			},
			{ parent: this, provider: pgProvider },
		)

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

		const databaseName = postgresDatabase.name
		const databaseDependency: pulumi.Resource = postgresDatabase

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
