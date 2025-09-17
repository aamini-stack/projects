import * as pulumi from '@pulumi/pulumi'
import { GitHubInfrastructure } from './src/github'
import { VercelInfrastructure } from './src/vercel'

const config = new pulumi.Config()

// Initialize GitHub infrastructure
const github = new GitHubInfrastructure('github', {
	owner: 'ariaamini',
	token: config.requireSecret('github:token'),
})

// Initialize Vercel infrastructure
const vercel = new VercelInfrastructure('vercel', {
	apiToken: config.requireSecret('vercel:apiToken'),
	team: config.get('vercel:team') ?? '',
	githubOrg: 'ariaamini',
})

// Export key outputs
export const githubRepository = github.repository
export const vercelProjects = vercel.projects
