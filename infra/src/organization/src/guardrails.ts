import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { GuardrailsAccountConfig } from './config.ts'

type AccountGuardrailsInput = {
	provider: aws.Provider
	managementAccountId: string
	ciCdPrincipalArn: string
	billingAlertEmail: string | undefined
	account: GuardrailsAccountConfig
}

export function createAccountGuardrails(input: AccountGuardrailsInput) {
	const alias = (name: string): pulumi.Alias => ({
		name,
		project: 'account-baseline',
		stack: input.account.environment,
	})

	const resourceName = (name: string) =>
		`guardrails-${input.account.environment}-${name}`

	const deploymentPrincipalPatterns = Array.from(
		new Set([
			input.ciCdPrincipalArn,
			...input.account.deploymentPrincipalPatterns,
		]),
	)

	const budgetTopic = new aws.sns.Topic(
		resourceName('budget-alerts'),
		{
			name: `aamini-${input.account.environment}-budget-alerts`,
		},
		{ aliases: [alias('budget-alerts')], provider: input.provider },
	)

	if (input.billingAlertEmail) {
		new aws.sns.TopicSubscription(
			resourceName('budget-alerts-email'),
			{
				topic: budgetTopic.arn,
				protocol: 'email',
				endpoint: input.billingAlertEmail,
			},
			{ aliases: [alias('budget-alerts-email')], provider: input.provider },
		)
	}

	new aws.budgets.Budget(
		resourceName('monthly-cost-budget'),
		{
			accountId: input.account.accountId,
			budgetType: 'COST',
			limitAmount: input.account.budgetLimitUsd.toFixed(2),
			limitUnit: 'USD',
			timeUnit: 'MONTHLY',
			costFilters: [
				{ name: 'TagKeyValue', values: ['user:Project$aamini-stack'] },
			],
			notifications: [
				{
					comparisonOperator: 'GREATER_THAN',
					threshold: 80,
					thresholdType: 'PERCENTAGE',
					notificationType: 'FORECASTED',
					subscriberSnsTopicArns: [budgetTopic.arn],
				},
				{
					comparisonOperator: 'GREATER_THAN',
					threshold: 100,
					thresholdType: 'PERCENTAGE',
					notificationType: 'ACTUAL',
					subscriberSnsTopicArns: [budgetTopic.arn],
				},
			],
		},
		{ aliases: [alias('monthly-cost-budget')], provider: input.provider },
	)

	const platformLogGroup = new aws.cloudwatch.LogGroup(
		resourceName('platform-events'),
		{
			name: `/aamini/${input.account.environment}/platform`,
			retentionInDays: 90,
		},
		{ aliases: [alias('platform-events')], provider: input.provider },
	)

	new aws.cloudwatch.MetricAlarm(
		resourceName('billing-alarm'),
		{
			name: `aamini-${input.account.environment}-estimated-charges`,
			comparisonOperator: 'GreaterThanThreshold',
			evaluationPeriods: 1,
			metricName: 'EstimatedCharges',
			namespace: 'AWS/Billing',
			period: 21600,
			statistic: 'Maximum',
			threshold: input.account.budgetLimitUsd,
			alarmDescription: `Alert when monthly spend exceeds ${input.account.budgetLimitUsd} USD`,
			dimensions: {
				Currency: 'USD',
			},
			alarmActions: [budgetTopic.arn],
			okActions: [budgetTopic.arn],
		},
		{ aliases: [alias('billing-alarm')], provider: input.provider },
	)

	const pulumiDeployRole = new aws.iam.Role(
		resourceName('pulumi-deploy-role'),
		{
			name: 'PulumiDeployRole',
			assumeRolePolicy: JSON.stringify({
				Version: '2012-10-17',
				Statement: [
					{
						Action: 'sts:AssumeRole',
						Effect: 'Allow',
						Principal: {
							AWS: `arn:aws:iam::${input.managementAccountId}:root`,
						},
						Condition: {
							ArnLike: {
								'aws:PrincipalArn':
									deploymentPrincipalPatterns.length === 1
										? deploymentPrincipalPatterns[0]
										: deploymentPrincipalPatterns,
							},
						},
					},
				],
			}),
		},
		{ aliases: [alias('pulumi-deploy-role')], provider: input.provider },
	)

	new aws.iam.RolePolicyAttachment(
		resourceName('pulumi-deploy-readonly-access'),
		{
			role: pulumiDeployRole.name,
			policyArn: 'arn:aws:iam::aws:policy/ReadOnlyAccess',
		},
		{
			aliases: [alias('pulumi-deploy-readonly-access')],
			provider: input.provider,
		},
	)

	new aws.iam.RolePolicy(
		resourceName('pulumi-deploy-platform-policy'),
		{
			role: pulumiDeployRole.id,
			policy: pulumi.jsonStringify({
				Version: '2012-10-17',
				Statement: [
					{
						Sid: 'PlatformEc2Networking',
						Effect: 'Allow',
						Action: [
							'ec2:AllocateAddress',
							'ec2:AssociateAddress',
							'ec2:AssociateRouteTable',
							'ec2:AttachInternetGateway',
							'ec2:AttachNetworkInterface',
							'ec2:AuthorizeSecurityGroupEgress',
							'ec2:AuthorizeSecurityGroupIngress',
							'ec2:CreateInternetGateway',
							'ec2:CreateLaunchTemplate',
							'ec2:CreateNatGateway',
							'ec2:CreateNetworkInterface',
							'ec2:CreateRoute',
							'ec2:CreateRouteTable',
							'ec2:CreateSecurityGroup',
							'ec2:CreateSubnet',
							'ec2:CreateTags',
							'ec2:CreateVpc',
							'ec2:CreateVpcEndpoint',
							'ec2:DeleteInternetGateway',
							'ec2:DeleteLaunchTemplate',
							'ec2:DeleteNatGateway',
							'ec2:DeleteNetworkInterface',
							'ec2:DeleteRoute',
							'ec2:DeleteRouteTable',
							'ec2:DeleteSecurityGroup',
							'ec2:DeleteSubnet',
							'ec2:DeleteTags',
							'ec2:DeleteVpc',
							'ec2:DeleteVpcEndpoints',
							'ec2:Describe*',
							'ec2:DetachInternetGateway',
							'ec2:DetachNetworkInterface',
							'ec2:DisassociateAddress',
							'ec2:DisassociateRouteTable',
							'ec2:ModifyLaunchTemplate',
							'ec2:ModifySubnetAttribute',
							'ec2:ModifyVpcAttribute',
							'ec2:ReleaseAddress',
							'ec2:ReplaceRoute',
							'ec2:RevokeSecurityGroupEgress',
							'ec2:RevokeSecurityGroupIngress',
						],
						Resource: '*',
					},
					{
						Sid: 'PlatformEks',
						Effect: 'Allow',
						Action: [
							'eks:CreateAddon',
							'eks:CreateCluster',
							'eks:CreateNodegroup',
							'eks:DeleteAddon',
							'eks:DeleteCluster',
							'eks:DeleteNodegroup',
							'eks:Describe*',
							'eks:List*',
							'eks:TagResource',
							'eks:UntagResource',
							'eks:UpdateAddon',
							'eks:UpdateClusterConfig',
							'eks:UpdateClusterVersion',
							'eks:UpdateNodegroupConfig',
							'eks:UpdateNodegroupVersion',
						],
						Resource: '*',
					},
					{
						Sid: 'PlatformEcr',
						Effect: 'Allow',
						Action: [
							'ecr:BatchCheckLayerAvailability',
							'ecr:BatchDeleteImage',
							'ecr:BatchGetImage',
							'ecr:CompleteLayerUpload',
							'ecr:CreateRepository',
							'ecr:DeleteLifecyclePolicy',
							'ecr:DeleteRepository',
							'ecr:DeleteRepositoryPolicy',
							'ecr:Describe*',
							'ecr:GetAuthorizationToken',
							'ecr:GetDownloadUrlForLayer',
							'ecr:GetLifecyclePolicy',
							'ecr:GetRepositoryPolicy',
							'ecr:InitiateLayerUpload',
							'ecr:List*',
							'ecr:PutImage',
							'ecr:PutLifecyclePolicy',
							'ecr:SetRepositoryPolicy',
							'ecr:TagResource',
							'ecr:UntagResource',
							'ecr:UploadLayerPart',
						],
						Resource: '*',
					},
					{
						Sid: 'PlatformRds',
						Effect: 'Allow',
						Action: [
							'rds:AddTagsToResource',
							'rds:CreateDBInstance',
							'rds:CreateDBSubnetGroup',
							'rds:DeleteDBInstance',
							'rds:DeleteDBSubnetGroup',
							'rds:Describe*',
							'rds:ListTagsForResource',
							'rds:ModifyDBInstance',
							'rds:ModifyDBSubnetGroup',
							'rds:RemoveTagsFromResource',
						],
						Resource: '*',
					},
					{
						Sid: 'PlatformIam',
						Effect: 'Allow',
						Action: [
							'iam:AttachRolePolicy',
							'iam:CreateInstanceProfile',
							'iam:CreateOpenIDConnectProvider',
							'iam:CreatePolicy',
							'iam:CreateRole',
							'iam:DeleteInstanceProfile',
							'iam:DeleteOpenIDConnectProvider',
							'iam:DeletePolicy',
							'iam:DeleteRole',
							'iam:DeleteRolePolicy',
							'iam:DetachRolePolicy',
							'iam:Get*',
							'iam:List*',
							'iam:PassRole',
							'iam:PutRolePolicy',
							'iam:RemoveRoleFromInstanceProfile',
							'iam:Tag*',
							'iam:Untag*',
							'iam:UpdateAssumeRolePolicy',
							'iam:UpdateOpenIDConnectProviderThumbprint',
							'iam:UpdateRole',
							'iam:UpdateRoleDescription',
						],
						Resource: '*',
					},
					{
						Sid: 'PlatformCloudFormationAndLogs',
						Effect: 'Allow',
						Action: [
							'cloudformation:CreateStack',
							'cloudformation:DeleteStack',
							'cloudformation:Describe*',
							'cloudformation:Get*',
							'cloudformation:List*',
							'cloudformation:UpdateStack',
							'logs:CreateLogGroup',
							'logs:DeleteLogGroup',
							'logs:Describe*',
							'logs:List*',
							'logs:PutRetentionPolicy',
							'logs:TagResource',
							'logs:UntagResource',
						],
						Resource: '*',
					},
					{
						Sid: 'PlatformSupportRead',
						Effect: 'Allow',
						Action: [
							'kms:DescribeKey',
							'kms:ListAliases',
							'kms:ListKeys',
							'ssm:GetParameter',
							'ssm:GetParameters',
							'ssm:GetParametersByPath',
							'ssm:DescribeParameters',
							'sts:GetCallerIdentity',
						],
						Resource: '*',
					},
				],
			}),
		},
		{
			aliases: [alias('pulumi-deploy-platform-policy')],
			provider: input.provider,
		},
	)

	const ciCdDeployRole = new aws.iam.Role(
		resourceName('cicd-deploy-role'),
		{
			name: 'CICDDeployRole',
			assumeRolePolicy: JSON.stringify({
				Version: '2012-10-17',
				Statement: [
					{
						Action: 'sts:AssumeRole',
						Effect: 'Allow',
						Principal: {
							AWS: input.ciCdPrincipalArn,
						},
					},
				],
			}),
		},
		{ aliases: [alias('cicd-deploy-role')], provider: input.provider },
	)

	new aws.iam.RolePolicyAttachment(
		resourceName('cicd-admin-access'),
		{
			role: ciCdDeployRole.name,
			policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
		},
		{ aliases: [alias('cicd-admin-access')], provider: input.provider },
	)

	const readOnlyAuditRole = new aws.iam.Role(
		resourceName('readonly-audit-role'),
		{
			name: 'ReadOnlyAuditRole',
			assumeRolePolicy: JSON.stringify({
				Version: '2012-10-17',
				Statement: [
					{
						Action: 'sts:AssumeRole',
						Effect: 'Allow',
						Principal: {
							AWS: `arn:aws:iam::${input.managementAccountId}:root`,
						},
					},
				],
			}),
		},
		{ aliases: [alias('readonly-audit-role')], provider: input.provider },
	)

	new aws.iam.RolePolicyAttachment(
		resourceName('readonly-audit-access'),
		{
			role: readOnlyAuditRole.name,
			policyArn: 'arn:aws:iam::aws:policy/ReadOnlyAccess',
		},
		{ aliases: [alias('readonly-audit-access')], provider: input.provider },
	)

	const breakGlassRole = new aws.iam.Role(
		resourceName('breakglass-role'),
		{
			name: 'BreakGlassRole',
			assumeRolePolicy: JSON.stringify({
				Version: '2012-10-17',
				Statement: [
					{
						Action: 'sts:AssumeRole',
						Effect: 'Allow',
						Principal: {
							AWS: `arn:aws:iam::${input.managementAccountId}:root`,
						},
						Condition: {
							Bool: {
								'aws:MultiFactorAuthPresent': 'true',
							},
						},
					},
				],
			}),
		},
		{ aliases: [alias('breakglass-role')], provider: input.provider },
	)

	new aws.iam.RolePolicyAttachment(
		resourceName('breakglass-admin-access'),
		{
			role: breakGlassRole.name,
			policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
		},
		{ aliases: [alias('breakglass-admin-access')], provider: input.provider },
	)

	return {
		providerRoleArn: pulumi.output(
			`arn:aws:iam::${input.account.accountId}:role/${input.account.assumeRoleName}`,
		),
		pulumiDeployRoleArn: pulumiDeployRole.arn,
		budgetAlertsTopicArn: budgetTopic.arn,
		platformLogGroupName: platformLogGroup.name,
		bootstrapRoles: {
			pulumiDeployRoleArn: pulumiDeployRole.arn,
			cicdDeployRoleArn: ciCdDeployRole.arn,
			readOnlyAuditRoleArn: readOnlyAuditRole.arn,
			breakGlassRoleArn: breakGlassRole.arn,
		},
	}
}
