import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

export function createIdentityCenterAccess(input: {
	provider: aws.Provider
	identityCenterArn: pulumi.Output<string>
	adminsGroupId: string
	operatorsGroupId?: string
	developersGroupId: string
	readOnlyGroupId: string
	managementAccountId: string
	stagingAccountId: string
	productionAccountId: string
}) {
	const operatorPrincipalId = input.operatorsGroupId ?? input.adminsGroupId

	const adminsPermissionSetArn = aws.ssoadmin.getPermissionSetOutput(
		{
			instanceArn: input.identityCenterArn,
			name: 'AWSAdministratorAccess',
		},
		{ provider: input.provider },
	).arn

	const adminsPermissionSet = {
		arn: adminsPermissionSetArn,
		name: pulumi.output('AWSAdministratorAccess'),
	}

	const operatorsPermissionSet = new aws.ssoadmin.PermissionSet(
		'operators-permission-set',
		{
			name: 'OperatorAccess',
			description: 'Production deployment access from the management account',
			instanceArn: input.identityCenterArn,
			sessionDuration: 'PT4H',
		},
		{ provider: input.provider },
	)

	new aws.ssoadmin.ManagedPolicyAttachment(
		'operators-power-user-access',
		{
			instanceArn: input.identityCenterArn,
			permissionSetArn: operatorsPermissionSet.arn,
			managedPolicyArn: 'arn:aws:iam::aws:policy/PowerUserAccess',
		},
		{ provider: input.provider },
	)

	new aws.ssoadmin.PermissionSetInlinePolicy(
		'operators-inline-policy',
		{
			instanceArn: input.identityCenterArn,
			permissionSetArn: operatorsPermissionSet.arn,
			inlinePolicy: pulumi.jsonStringify({
				Version: '2012-10-17',
				Statement: [
					{
						Effect: 'Allow',
						Action: ['sts:AssumeRole'],
						Resource: [
							`arn:aws:iam::${input.productionAccountId}:role/PulumiDeployRole`,
						],
					},
				],
			}),
		},
		{ provider: input.provider },
	)

	const developersPermissionSet = new aws.ssoadmin.PermissionSet(
		'developers-permission-set',
		{
			name: 'DeveloperAccess',
			description: 'Staging deployment access from the management account',
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

	new aws.ssoadmin.PermissionSetInlinePolicy(
		'developers-inline-policy',
		{
			instanceArn: input.identityCenterArn,
			permissionSetArn: developersPermissionSet.arn,
			inlinePolicy: pulumi.jsonStringify({
				Version: '2012-10-17',
				Statement: [
					{
						Effect: 'Allow',
						Action: ['sts:AssumeRole'],
						Resource: [
							`arn:aws:iam::${input.stagingAccountId}:role/PulumiDeployRole`,
						],
					},
				],
			}),
		},
		{ provider: input.provider },
	)

	const readOnlyPermissionSet = new aws.ssoadmin.PermissionSet(
		'read-only-permission-set',
		{
			name: 'ReadOnlyAccess',
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
		'admins-management-assignment',
		{
			instanceArn: input.identityCenterArn,
			permissionSetArn: adminsPermissionSet.arn,
			principalId: input.adminsGroupId,
			principalType: 'GROUP',
			targetId: input.managementAccountId,
			targetType: 'AWS_ACCOUNT',
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
		'operators-management-assignment',
		{
			instanceArn: input.identityCenterArn,
			permissionSetArn: operatorsPermissionSet.arn,
			principalId: operatorPrincipalId,
			principalType: 'GROUP',
			targetId: input.managementAccountId,
			targetType: 'AWS_ACCOUNT',
		},
		{ provider: input.provider },
	)

	new aws.ssoadmin.AccountAssignment(
		'developers-management-assignment',
		{
			instanceArn: input.identityCenterArn,
			permissionSetArn: developersPermissionSet.arn,
			principalId: input.developersGroupId,
			principalType: 'GROUP',
			targetId: input.managementAccountId,
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
			operators: operatorsPermissionSet.arn,
			developers: developersPermissionSet.arn,
			readOnly: readOnlyPermissionSet.arn,
		},
		pulumiOperatorRoleArn: pulumiOperatorRole.arn,
	}
}
