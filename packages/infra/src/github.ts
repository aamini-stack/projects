import * as github from '@pulumi/github'
import * as pulumi from '@pulumi/pulumi'

export interface GitHubInfrastructureArgs {
	owner: string
	token: pulumi.Output<string>
}

export class GitHubInfrastructure extends pulumi.ComponentResource {
	public readonly repository: github.Repository
	public readonly repositorySecrets: { [key: string]: github.ActionsSecret }

	constructor(
		name: string,
		args: GitHubInfrastructureArgs,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super('aamini:github:Infrastructure', name, {}, opts)

		// Configure the GitHub provider
		const provider = new github.Provider(
			'github-provider',
			{
				token: args.token,
				owner: args.owner,
			},
			{ parent: this },
		)

		// Create the main repository
		this.repository = new github.Repository(
			'aamini',
			{
				name: 'aamini',
				description:
					"Aria Amini's personal monorepo containing portfolio, projects, and applications",
				visibility: 'public',
				hasIssues: true,
				hasProjects: true,
				hasWiki: false,
				hasDownloads: true,
				autoInit: false,
				gitignoreTemplate: 'Node',
				licenseTemplate: 'mit',
				allowMergeCommit: true,
				allowSquashMerge: true,
				allowRebaseMerge: true,
				allowAutoMerge: true,
				deleteBranchOnMerge: true,
				allowUpdateBranch: true,
				squashMergeCommitTitle: 'PR_TITLE',
				squashMergeCommitMessage: 'PR_BODY',
				mergeCommitTitle: 'MERGE_MESSAGE',
				mergeCommitMessage: 'PR_TITLE',
				topics: [
					'monorepo',
					'portfolio',
					'react',
					'astro',
					'typescript',
					'tailwindcss',
					'vercel',
					'turborepo',
				],
				vulnerabilityAlerts: true,
				homepageUrl: 'https://ariaamini.com',
			},
			{
				provider,
				parent: this,
			},
		)

		// Create branch protection for main branch
		new github.BranchProtection(
			'main-protection',
			{
				repositoryId: this.repository.nodeId,
				pattern: 'main',
				enforceAdmins: false,
				allowsDeletions: false,
				allowsForcePushes: false,
				requiredLinearHistory: true,
				requireConversationResolution: true,
			},
			{
				provider,
				parent: this,
			},
		)

		// Repository secrets for CI/CD
		this.repositorySecrets = {}

		this.registerOutputs({
			repository: this.repository,
			repositorySecrets: this.repositorySecrets,
		})
	}
}
