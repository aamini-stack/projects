import * as pulumi from '@pulumi/pulumi'
import * as vercel from '@pulumiverse/vercel'

const vercelConfig = new pulumi.Config('vercel')

const args = {
	apiToken: vercelConfig.require('apiToken'),
	team: vercelConfig.require('team'),
	apps: [
		{
			name: 'portfolio',
		},
		{
			name: 'imdbgraph',
		},
		{
			name: 'pc-tune-ups',
		},
		{
			name: 'ducky-mot',
		},
	],
}

const provider = new vercel.Provider('vercel-provider', {
	apiToken: args.apiToken,
	team: args.team,
})

const vercelProjects = Object.fromEntries(
	args.apps.map((app) => [
		app.name,
		new vercel.Project(
			app.name,
			{
				framework: 'astro',
				gitComments: { onCommit: false, onPullRequest: true },
				gitRepository: {
					productionBranch: 'main',
					repo: 'aamini-stack/projects',
					type: 'github',
				},
				vercelAuthentication: { deploymentType: 'none' },
				ignoreCommand: 'exit 0',
				name: app.name,
				nodeVersion: '22.x',
				rootDirectory: `apps/${app.name}`,
				enableAffectedProjectsDeployments: true,
			},
			{ provider },
		),
	]),
)

export const projectIds = pulumi
	.output(vercelProjects)
	.apply((projects) =>
		Object.fromEntries(
			Object.entries(projects).map(([name, project]) => [name, project.id]),
		),
	)
