import * as github from '@pulumi/github'
import * as pulumi from '@pulumi/pulumi'
import * as vercel from '@pulumiverse/vercel'

const config = new pulumi.Config()

const provider = new vercel.Provider('vercel-provider', {
	apiToken: config.requireSecret('apiToken'),
	team: 'team_BMB11Zck0xVJiYVTGXOUqLiz',
})

const apps: { name: string; overrides?: vercel.ProjectArgs }[] = [
	{
		name: 'aamini-template',
	},
	{
		name: 'portfolio',
	},
	{
		name: 'imdbgraph',
	},
	{
		name: 'dota-visualizer',
	},
	{
		name: 'fruit-gen',
	},
	{
		name: 'ducky-mot',
		overrides: {
			vercelAuthentication: { deploymentType: 'none' },
		},
	},
]

const vercelProjects = Object.fromEntries(
	apps.map((app) => [
		app.name,
		{
			project: new vercel.Project(
				app.name,
				{
					framework: 'astro',
					gitComments: { onCommit: false, onPullRequest: true },
					gitRepository: {
						productionBranch: 'main',
						repo: 'aamini11/aamini',
						type: 'github',
					},
					vercelAuthentication: { deploymentType: 'standard_protection_new' },
					protectionBypassForAutomation: true,
					protectionBypassForAutomationSecret: config.requireSecret(
						'vercelAutomationBypassSecret',
					),
					ignoreCommand: 'npx turbo-ignore',
					name: app.name,
					nodeVersion: '22.x',
					rootDirectory: `apps/${app.name}`,
					teamId: 'team_BMB11Zck0xVJiYVTGXOUqLiz',
					...app.overrides,
				},
				{ provider },
			),
		},
	]),
)

const main = new github.BranchDefault('main', {
	branch: 'main',
	repository: 'aamini',
})

const repo = new github.Repository('repo', {
	allowMergeCommit: false,
	allowRebaseMerge: false,
	hasDownloads: true,
	name: 'aamini',
	securityAndAnalysis: {
		secretScanning: {
			status: 'disabled',
		},
		secretScanningPushProtection: {
			status: 'disabled',
		},
	},
	squashMergeCommitMessage: 'BLANK',
	squashMergeCommitTitle: 'PR_TITLE',
	visibility: 'public',
})

const secrets = [
	new github.ActionsSecret('vercelAutomationBypassSecret', {
		repository: 'aamini',
		plaintextValue: config.requireSecret('vercelAutomationBypassSecret'),
		secretName: 'VERCEL_AUTOMATION_BYPASS_SECRET',
	}),
	new github.ActionsSecret('vercelToken', {
		repository: 'aamini',
		plaintextValue: config.requireSecret('vercelToken'),
		secretName: 'VERCEL_TOKEN',
	}),
	new github.ActionsSecret('turboToken', {
		repository: 'aamini',
		plaintextValue: config.requireSecret('turboToken'),
		secretName: 'TURBO_TOKEN',
	}),
]

const variables = [
	new github.ActionsVariable('turboTeam', {
		repository: 'aamini',
		value: 'team_BMB11Zck0xVJiYVTGXOUqLiz',
		variableName: 'TURBO_TEAM',
	}),
]

export const variableNames = variables.map((variable) => variable.variableName)
export const secretNames = secrets.map((secret) => secret.secretName)
export const projectIds = Object.fromEntries(
	Object.entries(vercelProjects).map(([name, { project }]) => [
		name,
		project.id,
	]),
)
export const defaultBranch = main.branch
export const githubRepoName = repo.fullName
