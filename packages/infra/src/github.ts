import * as github from '@pulumi/github'
import * as pulumi from '@pulumi/pulumi'

const repo = new github.Repository(
	'repo',
	{
		name: 'projects',
		visibility: 'public',
		allowMergeCommit: false,
		allowRebaseMerge: false,
	},
	{ protect: true },
)

const defaultBranch = new github.BranchDefault('defaultBranch', {
	branch: 'main',
	repository: repo.name,
})

const vercelConfig = new pulumi.Config('vercel')

const actionSecrets = [
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
			repository: repo.name,
			secretName,
			plaintextValue: value,
		}),
)

const actionVariables = [
	{
		variableName: 'TURBO_TEAM',
		value: 'aamini',
	},
].map(
	({ variableName, value }) =>
		new github.ActionsVariable(variableName, {
			repository: repo.name,
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
