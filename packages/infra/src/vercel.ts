import * as pulumi from '@pulumi/pulumi'
import * as vercel from '@pulumiverse/vercel'

export interface VercelInfrastructureArgs {
	apiToken: pulumi.Output<string>
	team?: string
	githubOrg: string
}

export interface VercelProject {
	project: vercel.Project
	domains: vercel.ProjectDomain[]
	environmentVariables: vercel.ProjectEnvironmentVariable[]
}

export class VercelInfrastructure extends pulumi.ComponentResource {
	public readonly projects: { [key: string]: VercelProject }

	constructor(
		name: string,
		args: VercelInfrastructureArgs,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super('aamini:vercel:Infrastructure', name, {}, opts)

		// Configure the Vercel provider
		const provider = new vercel.Provider(
			'vercel-provider',
			{
				apiToken: args.apiToken,
				team: args.team ?? '',
			},
			{ parent: this },
		)

		// Define the applications from the monorepo
		const apps = [
			{
				name: 'portfolio',
				port: 4001,
				domain: 'ariaamini.com',
				framework: 'astro',
				buildCommand: 'pnpm build',
				outputDirectory: 'dist',
				installCommand: 'pnpm install',
				environmentPrefix: 'PORTFOLIO_',
			},
			{
				name: 'imdbgraph',
				port: 4002,
				domain: 'imdb.ariaamini.com',
				framework: 'astro',
				buildCommand: 'pnpm build',
				outputDirectory: 'dist',
				installCommand: 'pnpm install',
				environmentPrefix: 'IMDBGRAPH_',
			},
			{
				name: 'dota-visualizer',
				port: 4003,
				domain: 'dota.ariaamini.com',
				framework: 'astro',
				buildCommand: 'pnpm build',
				outputDirectory: 'dist',
				installCommand: 'pnpm install',
				environmentPrefix: 'DOTA_',
			},
			{
				name: 'fruit-gen',
				port: 4004,
				domain: 'fruit.ariaamini.com',
				framework: 'astro',
				buildCommand: 'pnpm build',
				outputDirectory: 'dist',
				installCommand: 'pnpm install',
				environmentPrefix: 'FRUIT_',
			},
		]

		this.projects = {}

		// Create Vercel projects for each app
		apps.forEach((app) => {
			const project = new vercel.Project(
				`${app.name}-project`,
				{
					name: `aamini-${app.name}`,
					framework: app.framework,
					gitRepository: {
						type: 'github',
						repo: `${args.githubOrg}/aamini`,
					},
					rootDirectory: `apps/${app.name}`,
					buildCommand: app.buildCommand,
					outputDirectory: app.outputDirectory,
					installCommand: app.installCommand,
					publicSource: false,
					directoryListing: false,
					gitForkProtection: true,
					devCommand: 'pnpm dev',
					ignoreCommand: `[[ \\"$VERCEL_GIT_COMMIT_REF\\" != \\"changeset-release/main\\" ]]`,
				},
				{
					provider,
					parent: this,
				},
			)

			// Create custom domain
			const domain = new vercel.ProjectDomain(
				`${app.name}-domain`,
				{
					projectId: project.id,
					domain: app.domain,
					gitBranch: 'main',
				},
				{
					provider,
					parent: this,
				},
			)

			// Create environment variables for production
			const envVars = [
				new vercel.ProjectEnvironmentVariable(
					`${app.name}-node-env`,
					{
						projectId: project.id,
						targets: ['production', 'preview'],
						key: 'NODE_ENV',
						value: 'production',
					},
					{
						provider,
						parent: this,
					},
				),
				new vercel.ProjectEnvironmentVariable(
					`${app.name}-app-env`,
					{
						projectId: project.id,
						targets: ['production'],
						key: `${app.environmentPrefix}ENV`,
						value: 'production',
					},
					{
						provider,
						parent: this,
					},
				),
				new vercel.ProjectEnvironmentVariable(
					`${app.name}-app-env-preview`,
					{
						projectId: project.id,
						targets: ['preview'],
						key: `${app.environmentPrefix}ENV`,
						value: 'preview',
					},
					{
						provider,
						parent: this,
					},
				),
			]

			this.projects[app.name] = {
				project,
				domains: [domain],
				environmentVariables: envVars,
			}
		})

		this.registerOutputs({
			projects: this.projects,
		})
	}
}
