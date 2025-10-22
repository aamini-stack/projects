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

const actionSecrets = [
	{
		secretName: 'VERCEL_AUTOMATION_BYPASS_SECRET',
		value: vercelConfig.requireSecret('automationBypassSecret'),
	},
	{
		secretName: 'VERCEL_TOKEN',
		value: vercelConfig.requireSecret('apiToken'),
	},
	{
		secretName: 'TURBO_TOKEN',
		value: vercelConfig.requireSecret('turboToken'),
	},
].map(
	({ secretName, value }) =>
		new github.ActionsSecret(secretName, {
			repository: repository,
			secretName,
			plaintextValue: value,
		}),
)

const actionVariables = [
	{
		variableName: 'TURBO_TEAM',
		value: vercelConfig.require('team'),
	},
].map(
	({ variableName, value }) =>
		new github.ActionsVariable(variableName, {
			repository: repository,
			variableName,
			value,
		}),
)

export const variableNames = Object.values(actionVariables).map(
	(variable) => variable.variableName,
)
export const secretNames = Object.values(actionSecrets).map(
	(secret) => secret.secretName,
)
export const defaultBranchName = defaultBranch.branch
export const githubRepoName = repo.fullName
