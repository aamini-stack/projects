import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

interface GithubActionsOidcConfig {
	enabled?: boolean
	roleName?: string
	repo?: string
	allowedRefs?: string[]
	allowedSubjects?: string[]
	allowPullRequest?: boolean
	allowedAudiences?: string[]
}

const config = new pulumi.Config()
const oidcConfig =
	config.getObject<GithubActionsOidcConfig>('githubActionsOidc')

const enabled = oidcConfig?.enabled ?? false

let githubActionsRoleArn: pulumi.Output<string> | undefined

if (enabled) {
	const roleName = oidcConfig?.roleName ?? 'github-actions-ecr-publish'
	const repo = oidcConfig?.repo ?? 'aamini-stack/projects'
	const allowedRefs = oidcConfig?.allowedRefs ?? ['refs/heads/main']
	const allowPullRequest = oidcConfig?.allowPullRequest ?? true
	const allowedSubjects = oidcConfig?.allowedSubjects ?? [
		...allowedRefs.map((ref) => `repo:${repo}:ref:${ref}`),
		...(allowPullRequest ? [`repo:${repo}:pull_request`] : []),
	]
	const allowedAudiences = oidcConfig?.allowedAudiences ?? ['sts.amazonaws.com']

	const oidcProvider = new aws.iam.OpenIdConnectProvider(
		'github-actions-oidc-provider',
		{
			url: 'https://token.actions.githubusercontent.com',
			clientIdLists: allowedAudiences,
			thumbprintLists: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
		},
	)

	const trustPolicy = pulumi.all([oidcProvider.arn]).apply(([providerArn]) =>
		JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Effect: 'Allow',
					Principal: {
						Federated: providerArn,
					},
					Action: 'sts:AssumeRoleWithWebIdentity',
					Condition: {
						StringEquals: {
							'token.actions.githubusercontent.com:aud':
								allowedAudiences.length === 1
									? allowedAudiences[0]
									: allowedAudiences,
						},
						StringLike: {
							'token.actions.githubusercontent.com:sub': allowedSubjects,
						},
					},
				},
			],
		}),
	)

	const role = new aws.iam.Role('github-actions-publish-role', {
		name: roleName,
		assumeRolePolicy: trustPolicy,
		description: 'Role assumed by GitHub Actions via OIDC for ECR publish',
	})

	new aws.iam.RolePolicy('github-actions-ecr-publish-policy', {
		role: role.id,
		policy: pulumi
			.all([
				aws.getRegionOutput({}).name,
				aws.getCallerIdentityOutput({}).accountId,
			])
			.apply(([region, accountId]) =>
				JSON.stringify({
					Version: '2012-10-17',
					Statement: [
						{
							Sid: 'EcrAuth',
							Effect: 'Allow',
							Action: ['ecr:GetAuthorizationToken'],
							Resource: '*',
						},
						{
							Sid: 'EcrPushPull',
							Effect: 'Allow',
							Action: [
								'ecr:BatchCheckLayerAvailability',
								'ecr:BatchGetImage',
								'ecr:CompleteLayerUpload',
								'ecr:DescribeImages',
								'ecr:DescribeRepositories',
								'ecr:GetDownloadUrlForLayer',
								'ecr:InitiateLayerUpload',
								'ecr:ListImages',
								'ecr:PutImage',
								'ecr:UploadLayerPart',
							],
							Resource: [`arn:aws:ecr:${region}:${accountId}:repository/*`],
						},
					],
				}),
			),
	})

	githubActionsRoleArn = role.arn
}

export { enabled, githubActionsRoleArn }
