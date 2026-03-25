import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

const config = new pulumi.Config()

const region = config.get('region') ?? 'us-east-1'
const environment = config.require('environment')
const accountId = config.require('accountId')
const managementAccountId = config.require('managementAccountId')
const assumeRoleName =
	config.get('assumeRoleName') ?? 'AWSControlTowerExecution'
const ciCdPrincipalArn = config.require('ciCdPrincipalArn')
const billingAlertEmail = config.get('billingAlertEmail')
const budgetLimitUsd = config.getNumber('budgetLimitUsd') ?? 150

const provider = new aws.Provider(`${environment}-provider`, {
	region,
	assumeRoles: [
		{
			roleArn: `arn:aws:iam::${accountId}:role/${assumeRoleName}`,
			sessionName: `pulumi-account-baseline-${environment}`,
		},
	],
	defaultTags: {
		tags: {
			Environment: environment,
			ManagedBy: 'Pulumi',
			Project: 'aamini-stack',
			Scope: 'account-baseline',
		},
	},
})

const budgetTopic = new aws.sns.Topic(
	'budget-alerts',
	{
		name: `aamini-${environment}-budget-alerts`,
	},
	{ provider },
)

if (billingAlertEmail) {
	new aws.sns.TopicSubscription(
		'budget-alerts-email',
		{
			topic: budgetTopic.arn,
			protocol: 'email',
			endpoint: billingAlertEmail,
		},
		{ provider },
	)
}

new aws.budgets.Budget(
	'monthly-cost-budget',
	{
		accountId,
		budgetType: 'COST',
		limitAmount: budgetLimitUsd.toFixed(2),
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
	{ provider },
)

const platformLogGroup = new aws.cloudwatch.LogGroup(
	'platform-events',
	{
		name: `/aamini/${environment}/platform`,
		retentionInDays: 90,
	},
	{ provider },
)

new aws.cloudwatch.MetricAlarm(
	'billing-alarm',
	{
		name: `aamini-${environment}-estimated-charges`,
		comparisonOperator: 'GreaterThanThreshold',
		evaluationPeriods: 1,
		metricName: 'EstimatedCharges',
		namespace: 'AWS/Billing',
		period: 21600,
		statistic: 'Maximum',
		threshold: budgetLimitUsd,
		alarmDescription: `Alert when monthly spend exceeds ${budgetLimitUsd} USD`,
		dimensions: {
			Currency: 'USD',
		},
		alarmActions: [budgetTopic.arn],
		okActions: [budgetTopic.arn],
	},
	{ provider },
)

const ciCdDeployRole = new aws.iam.Role(
	'cicd-deploy-role',
	{
		name: 'CICDDeployRole',
		assumeRolePolicy: JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Action: 'sts:AssumeRole',
					Effect: 'Allow',
					Principal: {
						AWS: ciCdPrincipalArn,
					},
				},
			],
		}),
	},
	{ provider },
)

new aws.iam.RolePolicyAttachment(
	'cicd-admin-access',
	{
		role: ciCdDeployRole.name,
		policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
	},
	{ provider },
)

const readOnlyAuditRole = new aws.iam.Role(
	'readonly-audit-role',
	{
		name: 'ReadOnlyAuditRole',
		assumeRolePolicy: JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Action: 'sts:AssumeRole',
					Effect: 'Allow',
					Principal: {
						AWS: `arn:aws:iam::${managementAccountId}:root`,
					},
				},
			],
		}),
	},
	{ provider },
)

new aws.iam.RolePolicyAttachment(
	'readonly-audit-access',
	{
		role: readOnlyAuditRole.name,
		policyArn: 'arn:aws:iam::aws:policy/ReadOnlyAccess',
	},
	{ provider },
)

const breakGlassRole = new aws.iam.Role(
	'breakglass-role',
	{
		name: 'BreakGlassRole',
		assumeRolePolicy: JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Action: 'sts:AssumeRole',
					Effect: 'Allow',
					Principal: {
						AWS: `arn:aws:iam::${managementAccountId}:root`,
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
	{ provider },
)

new aws.iam.RolePolicyAttachment(
	'breakglass-admin-access',
	{
		role: breakGlassRole.name,
		policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
	},
	{ provider },
)

export const providerRoleArn = pulumi.output(
	`arn:aws:iam::${accountId}:role/${assumeRoleName}`,
)
export const budgetAlertsTopicArn = budgetTopic.arn
export const platformLogGroupName = platformLogGroup.name
export const bootstrapRoles = {
	cicdDeployRoleArn: ciCdDeployRole.arn,
	readOnlyAuditRoleArn: readOnlyAuditRole.arn,
	breakGlassRoleArn: breakGlassRole.arn,
}
