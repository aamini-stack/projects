import * as controltower from '@lbrlabs/pulumi-awscontroltower'
import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

type RequestedAccount = {
	name: string
	email: string
	organizationalUnit: string
	ssoFirstName: string
	ssoLastName: string
	ssoEmail: string
	organizationalUnitIdOnDelete: string
	closeAccountOnDelete: boolean
	provisionedProductName: string
	pathId: string
	tags: Record<string, string>
}

const config = new pulumi.Config()

const region = config.get('region') ?? 'us-east-1'
const managementAccountId = config.require('managementAccountId')
const stagingAccountId = config.require('stagingAccountId')
const productionAccountId = config.require('productionAccountId')
const identityAssumeRoleName = config.get('identityAssumeRoleName') ?? 'none'

const adminsGroupId = config.require('adminsGroupId')
const developersGroupId = config.require('developersGroupId')
const readOnlyGroupId = config.require('readOnlyGroupId')

const requestedAccounts =
	config.requireObject<RequestedAccount[]>('requestedAccounts')

const managementProviderArgs: aws.ProviderArgs = { region }
if (identityAssumeRoleName !== 'none') {
	managementProviderArgs.assumeRoles = [
		{
			roleArn: `arn:aws:iam::${managementAccountId}:role/${identityAssumeRoleName}`,
			sessionName: 'pulumi-organization-identity',
		},
	]
}

const managementProvider = new aws.Provider(
	'management',
	managementProviderArgs,
)

const identityCenterInstances = aws.ssoadmin.getInstancesOutput(
	{},
	{ provider: managementProvider },
)
const identityCenterArn = identityCenterInstances.arns.apply((arns) => {
	const arn = arns[0]
	if (!arn) {
		throw new Error(
			'No IAM Identity Center instance found in this organization',
		)
	}

	return arn
})

const adminsPermissionSet = new aws.ssoadmin.PermissionSet(
	'admins-permission-set',
	{
		name: 'Admins',
		description: 'Broad admin access for trusted operators',
		instanceArn: identityCenterArn,
		sessionDuration: 'PT4H',
	},
	{ provider: managementProvider },
)

new aws.ssoadmin.ManagedPolicyAttachment(
	'admins-admin-access',
	{
		instanceArn: identityCenterArn,
		permissionSetArn: adminsPermissionSet.arn,
		managedPolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
	},
	{ provider: managementProvider },
)

const developersPermissionSet = new aws.ssoadmin.PermissionSet(
	'developers-permission-set',
	{
		name: 'Developers',
		description: 'Power user access in staging environments',
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

const readOnlyPermissionSet = new aws.ssoadmin.PermissionSet(
	'read-only-permission-set',
	{
		name: 'ReadOnly',
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

new aws.ssoadmin.AccountAssignment(
	'admins-staging-assignment',
	{
		instanceArn: identityCenterArn,
		permissionSetArn: adminsPermissionSet.arn,
		principalId: adminsGroupId,
		principalType: 'GROUP',
		targetId: stagingAccountId,
		targetType: 'AWS_ACCOUNT',
	},
	{ provider: managementProvider },
)

new aws.ssoadmin.AccountAssignment(
	'admins-production-assignment',
	{
		instanceArn: identityCenterArn,
		permissionSetArn: adminsPermissionSet.arn,
		principalId: adminsGroupId,
		principalType: 'GROUP',
		targetId: productionAccountId,
		targetType: 'AWS_ACCOUNT',
	},
	{ provider: managementProvider },
)

new aws.ssoadmin.AccountAssignment(
	'developers-staging-assignment',
	{
		instanceArn: identityCenterArn,
		permissionSetArn: developersPermissionSet.arn,
		principalId: developersGroupId,
		principalType: 'GROUP',
		targetId: stagingAccountId,
		targetType: 'AWS_ACCOUNT',
	},
	{ provider: managementProvider },
)

new aws.ssoadmin.AccountAssignment(
	'read-only-production-assignment',
	{
		instanceArn: identityCenterArn,
		permissionSetArn: readOnlyPermissionSet.arn,
		principalId: readOnlyGroupId,
		principalType: 'GROUP',
		targetId: productionAccountId,
		targetType: 'AWS_ACCOUNT',
	},
	{ provider: managementProvider },
)

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
						AWS: `arn:aws:iam::${managementAccountId}:root`,
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

const createdAccounts = requestedAccounts.map((account) => {
	const args: controltower.ControlTowerAwsAccountArgs = {
		name: account.name,
		email: account.email,
		organizationalUnit: account.organizationalUnit,
		closeAccountOnDelete: account.closeAccountOnDelete,
		organizationalUnitIdOnDelete: account.organizationalUnitIdOnDelete,
		provisionedProductName: account.provisionedProductName,
		pathId: account.pathId,
		sso: {
			firstName: account.ssoFirstName,
			lastName: account.ssoLastName,
			email: account.ssoEmail,
		},
		tags: {
			...account.tags,
			ManagedBy: 'Pulumi',
			Project: 'aamini-stack',
			Scope: 'organization',
		},
	}

	return new controltower.ControlTowerAwsAccount(account.name, args)
})

export const organization = {
	managementAccountId,
	stagingAccountId,
	productionAccountId,
}

export const identity = {
	identityCenterArn,
	permissionSets: {
		admins: adminsPermissionSet.arn,
		developers: developersPermissionSet.arn,
		readOnly: readOnlyPermissionSet.arn,
	},
	pulumiOperatorRoleArn: pulumiOperatorRole.arn,
}

export const controltowerOutputs = {
	configuredRegion: region,
	requestedAccountCount: requestedAccounts.length,
	createdAccountIds: createdAccounts.map((account) => account.accountId),
}
