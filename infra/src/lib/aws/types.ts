export type AwsAccount = {
	Id: string
	Name: string
	Status: string
}

export type AssumedRoleCredentials = {
	AccessKeyId: string
	SecretAccessKey: string
	SessionToken: string
}

export type CallerIdentity = {
	Account: string
	Arn: string
	UserId: string
}

export type SsoInstance = {
	InstanceArn: string
	IdentityStoreId: string
}

export type IdentityGroup = {
	DisplayName: string
	GroupId: string
}

export type AwsIamGetRoleResponse = {
	Role: {
		Arn: string
		RoleName: string
	}
}

export type AwsOrganizationsRoot = {
	Id: string
	Name: string
}

export type AwsOrganizationsOu = {
	Id: string
	Name: string
	Arn: string
}

export type AwsOrganizationsAccount = {
	Id: string
	Name: string
	Email: string
	Status: string
}

export type AwsOrganizationsPolicy = {
	Id: string
	Arn: string
	Name: string
	Description?: string
	Type: string
}

export type AwsOrganizationsDescribePolicy = {
	Policy: {
		PolicySummary: AwsOrganizationsPolicy
		Content: string
	}
}

export type AwsOrganizationsTarget = {
	TargetId: string
	Type: string
	Name?: string
}
