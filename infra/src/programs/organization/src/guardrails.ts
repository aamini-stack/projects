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
		budgetAlertsTopicArn: budgetTopic.arn,
		platformLogGroupName: platformLogGroup.name,
		bootstrapRoles: {
			cicdDeployRoleArn: ciCdDeployRole.arn,
			readOnlyAuditRoleArn: readOnlyAuditRole.arn,
			breakGlassRoleArn: breakGlassRole.arn,
		},
	}
}
