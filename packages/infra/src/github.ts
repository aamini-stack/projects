import * as github from '@pulumi/github'
import * as pulumi from '@pulumi/pulumi'

const repository = 'projects'

const repo = new github.Repository(
	'repo',
	{
		name: repository,
		visibility: 'public',
		allowMergeCommit: false,
		allowRebaseMerge: false,
	},
	{ protect: true },
)

const defaultBranch = new github.BranchDefault('defaultBranch', {
	branch: 'main',
	repository: repository,
})

const vercelConfig = new pulumi.Config('vercel')
const actionVariables = {
	secrets: [
		{
			name: 'vercelAutomationBypass',
			secretName: 'VERCEL_AUTOMATION_BYPASS_SECRET',
			value: vercelConfig.requireSecret('automationBypassSecret'),
		},
		{
			name: 'vercelToken',
			secretName: 'VERCEL_TOKEN',
			value: vercelConfig.requireSecret('apiToken'),
		},
		{
			name: 'vercelTurboToken',
			secretName: 'TURBO_TOKEN',
			value: vercelConfig.requireSecret('turboToken'),
		},
	],
	variables: [
		{
			name: 'vercelTeam',
			variableName: 'TURBO_TEAM',
			value: vercelConfig.require('team'),
		},
	],
}

const secrets = Object.fromEntries(
	actionVariables.secrets.map((secret) => [
		secret.name,
		new github.ActionsSecret(secret.name, {
			repository: repository,
			encryptedValue: secret.value,
			secretName: secret.secretName,
		}),
	]),
)

const variables = Object.fromEntries(
	actionVariables.variables.map((variable) => [
		variable.name,
		new github.ActionsVariable(variable.name, {
			repository: repository,
			value: variable.value,
			variableName: variable.variableName,
		}),
	]),
)

export const variableNames = Object.values(variables).map(
	(variable) => variable.variableName,
)
export const secretNames = Object.values(secrets).map(
	(secret) => secret.secretName,
)
export const defaultBranchName = defaultBranch.branch
export const githubRepoName = repo.fullName
