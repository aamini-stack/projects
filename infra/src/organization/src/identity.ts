import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

export function createIdentityCenterAccess(input: {
	provider: aws.Provider
	identityCenterArn: pulumi.Output<string>
	adminsGroupId: string
	developersGroupId: string
	readOnlyGroupId: string
	stagingAccountId: string
	productionAccountId: string
	managementAccountId: string
}) {
	const adminsPermissionSet = new aws.ssoadmin.PermissionSet(
		'admins-permission-set',
		{
			name: 'Admins',
			description: 'Broad admin access for trusted operators',
			instanceArn: input.identityCenterArn,
			sessionDuration: 'PT4H',
		},
		{ provider: input.provider },
	)

	new aws.ssoadmin.ManagedPolicyAttachment(
		'admins-admin-access',
		{
			instanceArn: input.identityCenterArn,
			permissionSetArn: adminsPermissionSet.arn,
			managedPolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
		},
		{ provider: input.provider },
	)

	const developersPermissionSet = new aws.ssoadmin.PermissionSet(
		'developers-permission-set',
		{
			name: 'Developers',
			description: 'Power user access in staging environments',
			instanceArn: input.identityCenterArn,
			sessionDuration: 'PT4H',
		},
		{ provider: input.provider },
	)

	new aws.ssoadmin.ManagedPolicyAttachment(
		'developers-power-user-access',
		{
			instanceArn: input.identityCenterArn,
			permissionSetArn: developersPermissionSet.arn,
			managedPolicyArn: 'arn:aws:iam::aws:policy/PowerUserAccess',
		},
		{ provider: input.provider },
	)

	const readOnlyPermissionSet = new aws.ssoadmin.PermissionSet(
		'read-only-permission-set',
		{
			name: 'ReadOnly',
			description: 'Read-only access for production by default',
			instanceArn: input.identityCenterArn,
			sessionDuration: 'PT2H',
		},
		{ provider: input.provider },
	)

	new aws.ssoadmin.ManagedPolicyAttachment(
		'read-only-access',
		{
			instanceArn: input.identityCenterArn,
			permissionSetArn: readOnlyPermissionSet.arn,
			managedPolicyArn: 'arn:aws:iam::aws:policy/ReadOnlyAccess',
		},
		{ provider: input.provider },
	)

	new aws.ssoadmin.AccountAssignment(
		'admins-staging-assignment',
		{
			instanceArn: input.identityCenterArn,
			permissionSetArn: adminsPermissionSet.arn,
			principalId: input.adminsGroupId,
			principalType: 'GROUP',
			targetId: input.stagingAccountId,
			targetType: 'AWS_ACCOUNT',
		},
		{ provider: input.provider },
	)

	new aws.ssoadmin.AccountAssignment(
		'admins-production-assignment',
		{
			instanceArn: input.identityCenterArn,
			permissionSetArn: adminsPermissionSet.arn,
			principalId: input.adminsGroupId,
			principalType: 'GROUP',
			targetId: input.productionAccountId,
			targetType: 'AWS_ACCOUNT',
		},
		{ provider: input.provider },
	)

	new aws.ssoadmin.AccountAssignment(
		'developers-staging-assignment',
		{
			instanceArn: input.identityCenterArn,
			permissionSetArn: developersPermissionSet.arn,
			principalId: input.developersGroupId,
			principalType: 'GROUP',
			targetId: input.stagingAccountId,
			targetType: 'AWS_ACCOUNT',
		},
		{ provider: input.provider },
	)

	new aws.ssoadmin.AccountAssignment(
		'read-only-production-assignment',
		{
			instanceArn: input.identityCenterArn,
			permissionSetArn: readOnlyPermissionSet.arn,
			principalId: input.readOnlyGroupId,
			principalType: 'GROUP',
			targetId: input.productionAccountId,
			targetType: 'AWS_ACCOUNT',
		},
		{ provider: input.provider },
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
							AWS: `arn:aws:iam::${input.managementAccountId}:root`,
						},
					},
				],
			}),
		},
		{ provider: input.provider },
	)

	new aws.iam.RolePolicyAttachment(
		'pulumi-operator-admin-access',
		{
			role: pulumiOperatorRole.name,
			policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
		},
		{ provider: input.provider },
	)

	return {
		identityCenterArn: input.identityCenterArn,
		permissionSets: {
			admins: adminsPermissionSet.arn,
			developers: developersPermissionSet.arn,
			readOnly: readOnlyPermissionSet.arn,
		},
		pulumiOperatorRoleArn: pulumiOperatorRole.arn,
	}
}
