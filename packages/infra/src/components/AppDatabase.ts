import * as azure from '@pulumi/azure-native'
import * as postgresql from '@pulumi/postgresql'
import * as pulumi from '@pulumi/pulumi'

export interface AppDatabaseArgs {
	name: pulumi.Input<string>
	serverResourceGroupName: pulumi.Input<string>
	serverName: pulumi.Input<string>
	serverHost: pulumi.Input<string>
	adminUser: pulumi.Input<string>
	runtimePrincipalObjectId: pulumi.Input<string>
}

export class AppDatabase extends pulumi.ComponentResource {
	public readonly databaseName: pulumi.Output<string>
	public readonly userName: pulumi.Output<string>

	constructor(
		name: string,
		args: AppDatabaseArgs,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super('aamini:infra:AppDatabase', name, {}, opts)

		const currentClient = azure.authorization.getClientConfigOutput()

		const pgProvider = new postgresql.Provider(
			`${name}-pg-provider`,
			{
				host: args.serverHost,
				username: args.adminUser,
				azureIdentityAuth: true,
				azureTenantId: currentClient.tenantId,
				sslmode: 'require',
				superuser: false,
			},
			{ parent: this },
		)

		const database = new azure.dbforpostgresql.Database(
			`${name}-db`,
			{
				resourceGroupName: args.serverResourceGroupName,
				serverName: args.serverName,
				databaseName: args.name,
				charset: 'UTF8',
				collation: 'en_US.utf8',
			},
			{ parent: this },
		)

		const appUserName = pulumi.output(args.name)

		const role = new postgresql.Role(
			`${name}-db-role`,
			{
				name: appUserName,
				login: true,
			},
			{
				parent: this,
				provider: pgProvider,
				dependsOn: [database],
				deletedWith: database,
			},
		)

		new postgresql.SecurityLabel(
			`${name}-db-role-entra-label`,
			{
				objectType: 'role',
				objectName: role.name,
				labelProvider: 'pgaadauth',
				label: pulumi.interpolate`aadauth,oid=${args.runtimePrincipalObjectId},type=service`,
			},
			{
				parent: this,
				provider: pgProvider,
				dependsOn: [database, role],
				deletedWith: database,
			},
		)

		new postgresql.Grant(
			`${name}-db-grant`,
			{
				role: role.name,
				database: database.name,
				objectType: 'database',
				privileges: ['ALL'],
			},
			{
				parent: this,
				provider: pgProvider,
				dependsOn: [database],
				deletedWith: database,
			},
		)

		new postgresql.Grant(
			`${name}-schema-grant`,
			{
				role: role.name,
				database: database.name,
				schema: 'public',
				objectType: 'schema',
				privileges: ['ALL'],
			},
			{
				parent: this,
				provider: pgProvider,
				dependsOn: [database],
				deletedWith: database,
			},
		)

		const dbProvider = new postgresql.Provider(
			`${name}-pg-db-provider`,
			{
				host: args.serverHost,
				username: args.adminUser,
				azureIdentityAuth: true,
				azureTenantId: currentClient.tenantId,
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

		new postgresql.Grant(
			`${name}-schema-sequence-grant`,
			{
				role: role.name,
				database: database.name,
				schema: 'public',
				objectType: 'sequence',
				privileges: ['ALL'],
			},
			{
				parent: this,
				provider: dbProvider,
				dependsOn: [database, role],
				deletedWith: database,
			},
		)

		this.databaseName = database.name
		this.userName = role.name
		this.registerOutputs({
			databaseName: this.databaseName,
			userName: this.userName,
		})
	}
}
