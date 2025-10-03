import * as flux from '@worawat/flux'
import * as pulumi from '@pulumi/pulumi'

const fluxConfig = new pulumi.Config('flux')
const githubConfig = new pulumi.Config('github')

const branch = 'main'
const targetPath = fluxConfig.require('targetPath')
const token = githubConfig.requireSecret('token')

const provider = new flux.Provider('fluxProvider', {
	kubernetes: {
		configPath: '~/.kube/config',
	},
	git: {
		url: `https://github.com/aamini-stack/projects.git`,
		branch: branch,
		http: {
			username: 'git',
			password: token,
		},
	},
})

const resource = new flux.FluxBootstrapGit(
	'flux',
	{
		path: targetPath,
		version: '2.7.0'
	},
	{
		provider: provider,
	},
)

export const bootstrapId = resource.id
