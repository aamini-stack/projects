import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

interface AiAgentConfig {
	enabled?: boolean
	roleName?: string
	userName?: string
	groupName?: string
	createAccessKey?: boolean
	stagingTagKey?: string
	stagingTagValue?: string
	allowedActions?: string[]
	allowedResourceArns?: string[]
}

const config = new pulumi.Config()
const aiAgentConfig = config.getObject<AiAgentConfig>('aiAgent') ?? {}

const enabled = aiAgentConfig.enabled ?? false

const roleName = aiAgentConfig.roleName ?? 'ai-agent-staging-role'
const userName = aiAgentConfig.userName ?? 'ai-agent-bootstrap-staging'
const groupName = aiAgentConfig.groupName ?? 'ai-agent-bootstrap-staging'
const userPath = '/ai-agent/'
const createAccessKey = aiAgentConfig.createAccessKey ?? true
const stagingTagKey = aiAgentConfig.stagingTagKey ?? 'Environment'
const stagingTagValue = aiAgentConfig.stagingTagValue ?? 'staging'

const allowedActions = aiAgentConfig.allowedActions ?? [
	's3:*',
	'logs:*',
	'lambda:InvokeFunction',
	'secretsmanager:GetSecretValue',
	'rds-db:connect',
	'rds:Describe*',
	'ec2:Describe*',
]

const allowedResourceArns = aiAgentConfig.allowedResourceArns ?? []

const commonDenyActions = [
	'iam:*',
	'organizations:*',
	'account:*',
	'sts:AssumeRole',
	'kms:ScheduleKeyDeletion',
	'kms:DisableKey',
	'kms:PutKeyPolicy',
]

const discoveryReadActions = [
	'sts:GetCallerIdentity',
	'ec2:Describe*',
	'rds:Describe*',
	'logs:Describe*',
	'logs:Get*',
	'logs:List*',
	'lambda:List*',
	'lambda:Get*',
	'secretsmanager:ListSecrets',
	'secretsmanager:DescribeSecret',
	'tag:GetResources',
	'tag:GetTagKeys',
	'tag:GetTagValues',
	's3:ListAllMyBuckets',
	's3:ListBucket',
]

let aiAgentRoleArn: pulumi.Output<string> | undefined
let aiAgentUserAccessKeyId: pulumi.Output<string> | undefined
let aiAgentUserSecretAccessKey: pulumi.Output<string> | undefined
let aiAgentUserName: pulumi.Output<string> | undefined

if (enabled) {
	const callerIdentity = aws.getCallerIdentityOutput({})
	const region = aws.getRegionOutput({})

	const prodNamePatternResources = pulumi
		.all([callerIdentity.accountId, region.name])
		.apply(([accountId, regionName]) => [
			'arn:aws:s3:::prod-*',
			'arn:aws:s3:::prod-*/*',
			`arn:aws:lambda:${regionName}:${accountId}:function:prod-*`,
			`arn:aws:secretsmanager:${regionName}:${accountId}:secret:prod-*`,
			`arn:aws:rds:${regionName}:${accountId}:db:prod-*`,
			`arn:aws:logs:${regionName}:${accountId}:log-group:*prod*`,
		])

	const boundaryPolicyDocument = aws.iam.getPolicyDocumentOutput({
		statements: [
			{
				effect: 'Allow',
				actions: ['*'],
				resources: ['*'],
			},
			{
				effect: 'Deny',
				actions: commonDenyActions,
				resources: ['*'],
			},
			{
				effect: 'Deny',
				actions: ['*'],
				resources: ['*'],
				conditions: [
					{
						test: 'StringEquals',
						variable: `aws:ResourceTag/${stagingTagKey}`,
						values: ['prod'],
					},
				],
			},
			{
				effect: 'Deny',
				actions: ['*'],
				resources: prodNamePatternResources,
			},
		],
	})

	const boundary = new aws.iam.Policy('ai-agent-staging-boundary', {
		name: 'ai-agent-staging-boundary',
		description: 'Permission boundary enforcing staging-only guardrails',
		policy: boundaryPolicyDocument.json,
	})

	const role = new aws.iam.Role('ai-agent-staging-role', {
		name: roleName,
		description: 'Role used by AI agents for staging-only access',
		permissionsBoundary: boundary.arn,
		assumeRolePolicy: aws.iam.getPolicyDocumentOutput({
			statements: [
				{
					actions: ['sts:AssumeRole'],
					principals: [
						{
							type: 'AWS',
							identifiers: [
								callerIdentity.accountId.apply(
									(accountId) =>
										`arn:aws:iam::${accountId}:user/ai-agent/${userName}`,
								),
							],
						},
					],
				},
			],
		}).json,
		tags: {
			[stagingTagKey]: stagingTagValue,
			ManagedBy: 'pulumi',
			Principal: 'ai-agent',
		},
	})

	const roleAccessStatements: aws.types.input.iam.GetPolicyDocumentStatement[] = [
		{
			effect: 'Allow',
			actions: discoveryReadActions,
			resources: ['*'],
		},
	]

	if (allowedResourceArns.length > 0) {
		roleAccessStatements.push({
			effect: 'Allow',
			actions: allowedActions,
			resources: allowedResourceArns,
		})
	} else {
		roleAccessStatements.push({
			effect: 'Allow',
			actions: allowedActions,
			resources: ['*'],
			conditions: [
				{
					test: 'StringEquals',
					variable: `aws:ResourceTag/${stagingTagKey}`,
					values: [stagingTagValue],
				},
			],
		})
	}

	const roleAccessPolicyDocument = aws.iam.getPolicyDocumentOutput({
		statements: roleAccessStatements,
	})

	const roleAccessPolicy = new aws.iam.Policy('ai-agent-staging-access', {
		name: 'ai-agent-staging-access',
		description: 'Access policy for AI agent role scoped to staging resources',
		policy: roleAccessPolicyDocument.json,
	})

	new aws.iam.RolePolicyAttachment('ai-agent-staging-access-attachment', {
		role: role.name,
		policyArn: roleAccessPolicy.arn,
	})

	const bootstrapGroup = new aws.iam.Group('ai-agent-bootstrap-group', {
		name: groupName,
	})

	const bootstrapUser = new aws.iam.User('ai-agent-bootstrap-user', {
		name: userName,
		path: userPath,
		forceDestroy: true,
		tags: {
			[stagingTagKey]: stagingTagValue,
			ManagedBy: 'pulumi',
			Principal: 'ai-agent-bootstrap',
		},
	})

	new aws.iam.UserGroupMembership('ai-agent-bootstrap-membership', {
		user: bootstrapUser.name,
		groups: [bootstrapGroup.name],
	})

	const assumeRolePolicy = new aws.iam.GroupPolicy('ai-agent-bootstrap-assume-role', {
		name: 'ai-agent-bootstrap-assume-role',
		group: bootstrapGroup.name,
		policy: aws.iam
			.getPolicyDocumentOutput({
				statements: [
					{
						effect: 'Allow',
						actions: ['sts:AssumeRole'],
						resources: [role.arn],
					},
				],
			})
			.json,
	})

	const denyDirectPolicy = new aws.iam.GroupPolicy('ai-agent-bootstrap-deny-direct', {
		name: 'ai-agent-bootstrap-deny-direct',
		group: bootstrapGroup.name,
		policy: aws.iam
			.getPolicyDocumentOutput({
				statements: [
					{
						effect: 'Deny',
						notActions: ['sts:AssumeRole', 'sts:GetCallerIdentity'],
						resources: ['*'],
					},
				],
			})
			.json,
	})

	const accessKey = createAccessKey
		? new aws.iam.AccessKey(
				'ai-agent-bootstrap-access-key',
				{ user: bootstrapUser.name },
				{ dependsOn: [assumeRolePolicy, denyDirectPolicy] },
			)
		: undefined

	aiAgentRoleArn = role.arn
	aiAgentUserAccessKeyId = accessKey?.id
	aiAgentUserSecretAccessKey = accessKey?.secret
	aiAgentUserName = bootstrapUser.name
}

export {
	enabled,
	aiAgentRoleArn,
	aiAgentUserAccessKeyId,
	aiAgentUserSecretAccessKey,
	aiAgentUserName,
}
