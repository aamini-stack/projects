import * as fs from 'node:fs'
import * as path from 'node:path'

import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

interface AiAgentSsoConfig {
	enabled?: boolean
	permissionSetName?: string
	userName?: string
	sessionDuration?: string
	startUrl?: string
	region?: string
}

const config = new pulumi.Config()
const ssoConfig = config.getObject<AiAgentSsoConfig>('aiAgentSso') ?? {}

const enabled = ssoConfig.enabled ?? false

let permissionSetArn: pulumi.Output<string> | undefined
let identityStoreId: pulumi.Output<string> | undefined
let instanceArn: pulumi.Output<string> | undefined
let principalUserId: pulumi.Output<string> | undefined
let cliProfileName: pulumi.Output<string> | undefined
let cliSsoStartUrl: pulumi.Output<string> | undefined

if (enabled) {
	const permissionSetName = ssoConfig.permissionSetName ?? 'agent-staging'
	const userName = ssoConfig.userName ?? 'ai-agent'
	const sessionDuration = ssoConfig.sessionDuration ?? 'PT4H'

	const ssoInstances = aws.ssoadmin.getInstancesOutput({})

	const activeInstanceArn = ssoInstances.arns.apply((arns) => {
		const arn = arns[0]
		if (!arn) {
			throw new Error('No active IAM Identity Center instance found.')
		}
		return arn
	})

	const activeIdentityStoreId = ssoInstances.identityStoreIds.apply((ids) => {
		const id = ids[0]
		if (!id) {
			throw new Error('No identity store ID found for IAM Identity Center instance.')
		}
		return id
	})

	const userLookup = aws.identitystore.getUsersOutput({
		identityStoreId: activeIdentityStoreId,
		region: ssoConfig.region ?? 'us-east-1',
	})

	const userId = userLookup.users.apply((users) => {
		const user = users.find((entry) => entry.userName === userName)
		if (!user?.userId) {
			throw new Error(
				`Could not find IAM Identity Center user '${userName}' in identity store.`,
			)
		}
		return user.userId
	})

	const inlinePolicyPath = path.resolve(
		__dirname,
		'../iam/agent-staging-permission-set-policy.json',
	)
	const inlinePolicy = fs.readFileSync(inlinePolicyPath, 'utf8')

	const permissionSet = new aws.ssoadmin.PermissionSet('ai-agent-sso-permission-set', {
		instanceArn: activeInstanceArn.apply((arn) => arn),
		name: permissionSetName,
		description: 'Staging-safe AWS SSO access path for AI agent operations',
		sessionDuration: sessionDuration,
	})

	new aws.ssoadmin.PermissionSetInlinePolicy('ai-agent-sso-inline-policy', {
		instanceArn: activeInstanceArn.apply((arn) => arn),
		permissionSetArn: permissionSet.arn,
		inlinePolicy,
	})

	const accountId = aws.getCallerIdentityOutput({}).accountId

	new aws.ssoadmin.AccountAssignment('ai-agent-sso-assignment', {
		instanceArn: activeInstanceArn.apply((arn) => arn),
		permissionSetArn: permissionSet.arn,
		principalId: userId,
		principalType: 'USER',
		targetId: accountId,
		targetType: 'AWS_ACCOUNT',
	})

	permissionSetArn = permissionSet.arn
	identityStoreId = activeIdentityStoreId
	instanceArn = activeInstanceArn
	principalUserId = userId
	cliProfileName = pulumi.output(permissionSetName)
	cliSsoStartUrl = pulumi.output(
		ssoConfig.startUrl ?? 'https://d-906604ca32.awsapps.com/start',
	)
}

export {
	enabled,
	permissionSetArn,
	identityStoreId,
	instanceArn,
	principalUserId,
	cliProfileName,
	cliSsoStartUrl,
}
