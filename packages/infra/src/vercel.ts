import * as pulumi from '@pulumi/pulumi'
import * as vercel from '@pulumiverse/vercel'

const vercelConfig = new pulumi.Config('vercel')

const args = {
	apiToken: vercelConfig.require('apiToken'),
	team: vercelConfig.require('team'),
	automationBypassSecret: vercelConfig.require('automationBypassSecret'),
	apps: [
		{ name: 'aamini-template' },
		{ name: 'portfolio' },
		{ name: 'imdbgraph' },
		{ name: 'dota-visualizer' },
		{ name: 'fruit-gen' },
		{ name: 'pc-tune-ups' },
		{
			name: 'ducky-mot',
			overrides: {
				vercelAuthentication: { deploymentType: 'none' },
			},
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
				vercelAuthentication: { deploymentType: 'standard_protection_new' },
				protectionBypassForAutomation: true,
				protectionBypassForAutomationSecret: args.automationBypassSecret,
				ignoreCommand: 'exit 0',
				name: app.name,
				nodeVersion: '22.x',
				rootDirectory: `apps/${app.name}`,
				teamId: args.team,
				enableAffectedProjectsDeployments: true,
				...app.overrides,
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
