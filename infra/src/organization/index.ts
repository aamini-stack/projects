import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

// =============================================================================
// TYPES
// =============================================================================

type Config = {
	organization: { region: string; managementAccountId: string }
	identity: {
		assumeRoleName: string
		requiredCallerRoleFragment?: string
		adminsGroupId: string
		operatorsGroupId?: string
		developersGroupId: string
		readOnlyGroupId: string
	}
	accounts: {
		staging: { accountId: string; assumeRoleName: string }
		production: { accountId: string; assumeRoleName: string }
	}
	guardrails: {
		billingAlertEmail?: string
		ciCdPrincipalArn: string
		staging: GuardrailsAccount
		production: GuardrailsAccount
	}
}

type GuardrailsAccount = {
	environment: 'staging' | 'production'
	accountId: string
	assumeRoleName: string
	budgetLimitUsd: number
	deploymentPrincipalPatterns: string[]
}

type ImportedPolicy = {
	key: string
	name: string
	id: string
	attachToKey?: 'infrastructure' | 'workloads'
}

// =============================================================================
// CONFIGURATION
// =============================================================================

function loadConfig(): Config {
	const cfg = new pulumi.Config()

	return {
		organization: cfg.requireObject('organization'),
		identity: cfg.requireObject('identity'),
		accounts: cfg.requireObject('accounts'),
		guardrails: cfg.requireObject('guardrails'),
	}
}

const config = loadConfig()

// =============================================================================
// CONSTANTS
// =============================================================================

const IMPORTED_POLICIES: ImportedPolicy[] = []

const PLATFORM_POLICY = {
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
}

// =============================================================================
// PROVIDER SETUP
// =============================================================================

const managementProvider = new aws.Provider('management', {
	region: config.organization.region,
	...(config.identity.assumeRoleName !== 'none' && {
		assumeRoles: [
			{
				roleArn: `arn:aws:iam::${config.organization.managementAccountId}:role/${config.identity.assumeRoleName}`,
				sessionName: 'pulumi-organization-identity',
			},
		],
	}),
})

const makeGuardrailsProvider = (account: GuardrailsAccount) =>
	new aws.Provider(`guardrails-${account.environment}-provider`, {
		region: config.organization.region,
		assumeRoles: [
			{
				roleArn: `arn:aws:iam::${account.accountId}:role/${account.assumeRoleName}`,
				sessionName: `pulumi-organization-guardrails-${account.environment}`,
			},
		],
		defaultTags: {
			tags: {
				Environment: account.environment,
				ManagedBy: 'Pulumi',
				Project: 'aamini-stack',
				Scope: 'guardrails',
			},
		},
	})

const stagingGuardrailsProvider = makeGuardrailsProvider(
	config.guardrails.staging,
)
const productionGuardrailsProvider = makeGuardrailsProvider(
	config.guardrails.production,
)

// =============================================================================
// IDENTITY CENTER
// =============================================================================

const identityCenterArn = aws.ssoadmin
	.getInstancesOutput({}, { provider: managementProvider })
	.arns.apply((arns) => {
		const arn = arns[0]
		if (!arn) throw new Error('No IAM Identity Center instance found')
		return arn
	})

const adminsPermissionSetArn = aws.ssoadmin.getPermissionSetOutput(
	{ instanceArn: identityCenterArn, name: 'AWSAdministratorAccess' },
	{ provider: managementProvider },
).arn

const operatorsPermissionSet = new aws.ssoadmin.PermissionSet(
	'operators-permission-set',
	{
		name: 'OperatorAccess',
		description: 'Production deployment access from the management account',
		instanceArn: identityCenterArn,
		sessionDuration: 'PT4H',
	},
	{ provider: managementProvider },
)

new aws.ssoadmin.ManagedPolicyAttachment(
	'operators-power-user-access',
	{
		instanceArn: identityCenterArn,
		permissionSetArn: operatorsPermissionSet.arn,
		managedPolicyArn: 'arn:aws:iam::aws:policy/PowerUserAccess',
	},
	{ provider: managementProvider },
)

new aws.ssoadmin.PermissionSetInlinePolicy(
	'operators-inline-policy',
	{
		instanceArn: identityCenterArn,
		permissionSetArn: operatorsPermissionSet.arn,
		inlinePolicy: pulumi.jsonStringify({
			Version: '2012-10-17',
			Statement: [
				{
					Effect: 'Allow',
					Action: ['sts:AssumeRole'],
					Resource: [
						`arn:aws:iam::${config.accounts.production.accountId}:role/PulumiDeployRole`,
					],
				},
			],
		}),
	},
	{ provider: managementProvider },
)

const developersPermissionSet = new aws.ssoadmin.PermissionSet(
	'developers-permission-set',
	{
		name: 'DeveloperAccess',
		description: 'Staging deployment access from the management account',
		instanceArn: identityCenterArn,
		sessionDuration: 'PT4H',
	},
	{ provider: managementProvider },
)

new aws.ssoadmin.ManagedPolicyAttachment(
	'developers-power-user-access',
	{
		instanceArn: identityCenterArn,
		permissionSetArn: developersPermissionSet.arn,
		managedPolicyArn: 'arn:aws:iam::aws:policy/PowerUserAccess',
	},
	{ provider: managementProvider },
)

new aws.ssoadmin.PermissionSetInlinePolicy(
	'developers-inline-policy',
	{
		instanceArn: identityCenterArn,
		permissionSetArn: developersPermissionSet.arn,
		inlinePolicy: pulumi.jsonStringify({
			Version: '2012-10-17',
			Statement: [
				{
					Effect: 'Allow',
					Action: ['sts:AssumeRole'],
					Resource: [
						`arn:aws:iam::${config.accounts.staging.accountId}:role/PulumiDeployRole`,
					],
				},
			],
		}),
	},
	{ provider: managementProvider },
)

const readOnlyPermissionSet = new aws.ssoadmin.PermissionSet(
	'read-only-permission-set',
	{
		name: 'ReadOnlyAccess',
		description: 'Read-only access for production by default',
		instanceArn: identityCenterArn,
		sessionDuration: 'PT2H',
	},
	{ provider: managementProvider },
)

new aws.ssoadmin.ManagedPolicyAttachment(
	'read-only-access',
	{
		instanceArn: identityCenterArn,
		permissionSetArn: readOnlyPermissionSet.arn,
		managedPolicyArn: 'arn:aws:iam::aws:policy/ReadOnlyAccess',
	},
	{ provider: managementProvider },
)

// Account assignments - all 7 of them, explicit and chunky
const operatorPrincipalId =
	config.identity.operatorsGroupId ?? config.identity.adminsGroupId

new aws.ssoadmin.AccountAssignment(
	'admins-management',
	{
		instanceArn: identityCenterArn,
		permissionSetArn: adminsPermissionSetArn,
		principalId: config.identity.adminsGroupId,
		principalType: 'GROUP',
		targetId: config.organization.managementAccountId,
		targetType: 'AWS_ACCOUNT',
	},
	{ provider: managementProvider },
)

new aws.ssoadmin.AccountAssignment(
	'admins-staging',
	{
		instanceArn: identityCenterArn,
		permissionSetArn: adminsPermissionSetArn,
		principalId: config.identity.adminsGroupId,
		principalType: 'GROUP',
		targetId: config.accounts.staging.accountId,
		targetType: 'AWS_ACCOUNT',
	},
	{ provider: managementProvider },
)

new aws.ssoadmin.AccountAssignment(
	'admins-production',
	{
		instanceArn: identityCenterArn,
		permissionSetArn: adminsPermissionSetArn,
		principalId: config.identity.adminsGroupId,
		principalType: 'GROUP',
		targetId: config.accounts.production.accountId,
		targetType: 'AWS_ACCOUNT',
	},
	{ provider: managementProvider },
)

new aws.ssoadmin.AccountAssignment(
	'operators-management',
	{
		instanceArn: identityCenterArn,
		permissionSetArn: operatorsPermissionSet.arn,
		principalId: operatorPrincipalId,
		principalType: 'GROUP',
		targetId: config.organization.managementAccountId,
		targetType: 'AWS_ACCOUNT',
	},
	{ provider: managementProvider },
)

new aws.ssoadmin.AccountAssignment(
	'developers-management',
	{
		instanceArn: identityCenterArn,
		permissionSetArn: developersPermissionSet.arn,
		principalId: config.identity.developersGroupId,
		principalType: 'GROUP',
		targetId: config.organization.managementAccountId,
		targetType: 'AWS_ACCOUNT',
	},
	{ provider: managementProvider },
)

new aws.ssoadmin.AccountAssignment(
	'read-only-production',
	{
		instanceArn: identityCenterArn,
		permissionSetArn: readOnlyPermissionSet.arn,
		principalId: config.identity.readOnlyGroupId,
		principalType: 'GROUP',
		targetId: config.accounts.production.accountId,
		targetType: 'AWS_ACCOUNT',
	},
	{ provider: managementProvider },
)

// Pulumi Operator Role (in management account)
const pulumiOperatorRole = new aws.iam.Role(
	'pulumi-operator-role',
	{
		name: 'PulumiOperatorRole',
		assumeRolePolicy: JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Action: 'sts:AssumeRole',
					Effect: 'Allow',
					Principal: {
						AWS: `arn:aws:iam::${config.organization.managementAccountId}:root`,
					},
				},
			],
		}),
	},
	{ provider: managementProvider },
)

new aws.iam.RolePolicyAttachment(
	'pulumi-operator-admin-access',
	{
		role: pulumiOperatorRole.name,
		policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
	},
	{ provider: managementProvider },
)

// =============================================================================
// ORGANIZATION TOPOLOGY
// =============================================================================

const liveOrganization = aws.organizations.getOrganizationOutput(
	{},
	{ provider: managementProvider },
)
const rootId = liveOrganization.roots.apply((roots) => {
	const root = roots[0]
	if (!root) throw new Error('No AWS Organizations root found')
	return root.id
})

const infrastructureOu = new aws.organizations.OrganizationalUnit(
	'ou-infrastructure',
	{
		name: 'Infrastructure',
		parentId: rootId,
		tags: {
			ManagedBy: 'Pulumi',
			Project: 'aamini-stack',
			Scope: 'organization-topology',
			Path: 'Infrastructure',
		},
	},
	{ provider: managementProvider },
)

const workloadsOu = new aws.organizations.OrganizationalUnit(
	'ou-workloads',
	{
		name: 'Workloads',
		parentId: rootId,
		tags: {
			ManagedBy: 'Pulumi',
			Project: 'aamini-stack',
			Scope: 'organization-topology',
			Path: 'Workloads',
		},
	},
	{ provider: managementProvider },
)

const organizationalUnits = {
	infrastructure: infrastructureOu,
	workloads: workloadsOu,
}

const stagingAccount = aws.organizations.getAccountOutput(
	{ accountId: config.accounts.staging.accountId },
	{ provider: managementProvider },
)

const productionAccount = aws.organizations.getAccountOutput(
	{ accountId: config.accounts.production.accountId },
	{ provider: managementProvider },
)

// Attach imported SCPs
IMPORTED_POLICIES.forEach((policy) => {
	if (!policy.attachToKey) return
	const importedPolicy = aws.organizations.Policy.get(
		`scp-${policy.key}`,
		policy.id,
		undefined,
		{ provider: managementProvider },
	)
	const target = organizationalUnits[policy.attachToKey]
	new aws.organizations.PolicyAttachment(
		`scp-${policy.key}-attachment`,
		{
			policyId: importedPolicy.id,
			targetId: target.id,
		},
		{ provider: managementProvider },
	)
})

// =============================================================================
// GUARDRAILS (Per-Account)
// =============================================================================

function createGuardrails(account: GuardrailsAccount, provider: aws.Provider) {
	const resourceAlias = (name: string): pulumi.Alias => ({
		name,
		project: 'account-baseline',
		stack: account.environment,
	})
	const resourceName = (name: string) =>
		`guardrails-${account.environment}-${name}`
	const deploymentPrincipals = Array.from(
		new Set([
			config.guardrails.ciCdPrincipalArn,
			...account.deploymentPrincipalPatterns,
		]),
	)

	// Budget alerts
	const budgetTopic = new aws.sns.Topic(
		resourceName('budget-alerts'),
		{
			name: `aamini-${account.environment}-budget-alerts`,
		},
		{ aliases: [resourceAlias('budget-alerts')], provider },
	)

	if (config.guardrails.billingAlertEmail) {
		new aws.sns.TopicSubscription(
			resourceName('budget-alerts-email'),
			{
				topic: budgetTopic.arn,
				protocol: 'email',
				endpoint: config.guardrails.billingAlertEmail,
			},
			{ aliases: [resourceAlias('budget-alerts-email')], provider },
		)
	}

	new aws.budgets.Budget(
		resourceName('monthly-cost-budget'),
		{
			accountId: account.accountId,
			budgetType: 'COST',
			limitAmount: account.budgetLimitUsd.toFixed(2),
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
		{ aliases: [resourceAlias('monthly-cost-budget')], provider },
	)

	// CloudWatch logging and billing alarm
	const platformLogGroup = new aws.cloudwatch.LogGroup(
		resourceName('platform-events'),
		{
			name: `/aamini/${account.environment}/platform`,
			retentionInDays: 90,
		},
		{ aliases: [resourceAlias('platform-events')], provider },
	)

	new aws.cloudwatch.MetricAlarm(
		resourceName('billing-alarm'),
		{
			name: `aamini-${account.environment}-estimated-charges`,
			comparisonOperator: 'GreaterThanThreshold',
			evaluationPeriods: 1,
			metricName: 'EstimatedCharges',
			namespace: 'AWS/Billing',
			period: 21600,
			statistic: 'Maximum',
			threshold: account.budgetLimitUsd,
			alarmDescription: `Alert when monthly spend exceeds ${account.budgetLimitUsd} USD`,
			dimensions: { Currency: 'USD' },
			alarmActions: [budgetTopic.arn],
			okActions: [budgetTopic.arn],
		},
		{ aliases: [resourceAlias('billing-alarm')], provider },
	)

	// IAM Roles
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
							AWS: `arn:aws:iam::${config.organization.managementAccountId}:root`,
						},
						Condition: {
							ArnLike: {
								'aws:PrincipalArn':
									deploymentPrincipals.length === 1
										? deploymentPrincipals[0]
										: deploymentPrincipals,
							},
						},
					},
				],
			}),
		},
		{ aliases: [resourceAlias('pulumi-deploy-role')], provider },
	)

	new aws.iam.RolePolicyAttachment(
		resourceName('pulumi-deploy-readonly-access'),
		{
			role: pulumiDeployRole.name,
			policyArn: 'arn:aws:iam::aws:policy/ReadOnlyAccess',
		},
		{ aliases: [resourceAlias('pulumi-deploy-readonly-access')], provider },
	)

	new aws.iam.RolePolicy(
		resourceName('pulumi-deploy-platform-policy'),
		{
			role: pulumiDeployRole.id,
			policy: pulumi.jsonStringify(PLATFORM_POLICY),
		},
		{ aliases: [resourceAlias('pulumi-deploy-platform-policy')], provider },
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
						Principal: { AWS: config.guardrails.ciCdPrincipalArn },
					},
				],
			}),
		},
		{ aliases: [resourceAlias('cicd-deploy-role')], provider },
	)

	new aws.iam.RolePolicyAttachment(
		resourceName('cicd-admin-access'),
		{
			role: ciCdDeployRole.name,
			policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
		},
		{ aliases: [resourceAlias('cicd-admin-access')], provider },
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
							AWS: `arn:aws:iam::${config.organization.managementAccountId}:root`,
						},
					},
				],
			}),
		},
		{ aliases: [resourceAlias('readonly-audit-role')], provider },
	)

	new aws.iam.RolePolicyAttachment(
		resourceName('readonly-audit-access'),
		{
			role: readOnlyAuditRole.name,
			policyArn: 'arn:aws:iam::aws:policy/ReadOnlyAccess',
		},
		{ aliases: [resourceAlias('readonly-audit-access')], provider },
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
							AWS: `arn:aws:iam::${config.organization.managementAccountId}:root`,
						},
						Condition: { Bool: { 'aws:MultiFactorAuthPresent': 'true' } },
					},
				],
			}),
		},
		{ aliases: [resourceAlias('breakglass-role')], provider },
	)

	new aws.iam.RolePolicyAttachment(
		resourceName('breakglass-admin-access'),
		{
			role: breakGlassRole.name,
			policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
		},
		{ aliases: [resourceAlias('breakglass-admin-access')], provider },
	)

	return {
		providerRoleArn: pulumi.output(
			`arn:aws:iam::${account.accountId}:role/${account.assumeRoleName}`,
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

const stagingGuardrails = createGuardrails(
	config.guardrails.staging,
	stagingGuardrailsProvider,
)
const productionGuardrails = createGuardrails(
	config.guardrails.production,
	productionGuardrailsProvider,
)

// =============================================================================
// VALIDATION
// =============================================================================

const managementCallerIdentity = aws.getCallerIdentityOutput(
	{},
	{ provider: managementProvider },
)

const validatedManagementCallerArn = pulumi
	.output(managementCallerIdentity.arn)
	.apply((arn) => {
		const fragment = config.identity.requiredCallerRoleFragment
		if (fragment && !arn.includes(fragment)) {
			throw new Error(
				`The organization stack must be run with a principal containing "${fragment}". Current caller ARN: ${arn}`,
			)
		}
		return arn
	})

// =============================================================================
// EXPORTS
// =============================================================================

export const workloadAccess = {
	region: config.organization.region,
	staging: {
		accountId: config.accounts.staging.accountId,
		assumeRoleName: config.guardrails.staging.assumeRoleName,
		organizationAccessRoleArn: stagingGuardrails.providerRoleArn,
		pulumiDeployRoleArn: stagingGuardrails.pulumiDeployRoleArn,
	},
	production: {
		accountId: config.accounts.production.accountId,
		assumeRoleName: config.guardrails.production.assumeRoleName,
		organizationAccessRoleArn: productionGuardrails.providerRoleArn,
		pulumiDeployRoleArn: productionGuardrails.pulumiDeployRoleArn,
	},
}

export const organization = {
	organizationId: liveOrganization.id,
	rootId,
	managementAccountId: config.organization.managementAccountId,
	stagingAccountId: config.accounts.staging.accountId,
	productionAccountId: config.accounts.production.accountId,
}

export const organizationStructure = {
	organizationalUnits: {
		infrastructure: {
			id: infrastructureOu.id,
			arn: infrastructureOu.arn,
			name: infrastructureOu.name,
			path: 'Infrastructure',
			parentId: rootId,
		},
		workloads: {
			id: workloadsOu.id,
			arn: workloadsOu.arn,
			name: workloadsOu.name,
			path: 'Workloads',
			parentId: rootId,
		},
	},
	accounts: {
		management: {
			id: config.organization.managementAccountId,
			parentId: rootId,
			desiredPlacement: 'Root/Management',
		},
		staging: stagingAccount.apply((a) => ({
			id: a.id,
			parentId: a.parentId,
			desiredPlacement: 'Workloads/Staging',
		})),
		production: productionAccount.apply((a) => ({
			id: a.id,
			parentId: a.parentId,
			desiredPlacement: 'Workloads/Production',
		})),
	},
	controlTowerManagedOus: ['workloads'],
}

export const identity = {
	identityCenterArn,
	permissionSets: {
		admins: adminsPermissionSetArn,
		operators: operatorsPermissionSet.arn,
		developers: developersPermissionSet.arn,
		readOnly: readOnlyPermissionSet.arn,
	},
	pulumiOperatorRoleArn: pulumiOperatorRole.arn,
}

export const managementCallerArn = validatedManagementCallerArn

export const serviceControlPolicies = {
	configuredPolicyCount: IMPORTED_POLICIES.length,
	policies: {},
}

export const guardrailsOutputs = {
	staging: stagingGuardrails,
	production: productionGuardrails,
}
