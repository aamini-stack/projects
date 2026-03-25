import * as aws from '@pulumi/aws'

import { loadOrganizationConfig } from './src/config.ts'
import { createAccountGuardrails } from './src/guardrails.ts'
import { createIdentityCenterAccess } from './src/identity.ts'
import { importedAccounts, importedPolicies } from './src/imports.ts'
import { createOrganizationTopology } from './src/topology.ts'

const config = loadOrganizationConfig()

const {
	organization: organizationConfig,
	identity: identityConfig,
	accounts,
	guardrails,
} = config

const managementProviderArgs: aws.ProviderArgs = {
	region: organizationConfig.region,
}
if (identityConfig.assumeRoleName !== 'none') {
	managementProviderArgs.assumeRoles = [
		{
			roleArn: `arn:aws:iam::${organizationConfig.managementAccountId}:role/${identityConfig.assumeRoleName}`,
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

const identity = createIdentityCenterAccess({
	provider: managementProvider,
	identityCenterArn,
	adminsGroupId: identityConfig.adminsGroupId,
	developersGroupId: identityConfig.developersGroupId,
	readOnlyGroupId: identityConfig.readOnlyGroupId,
	stagingAccountId: accounts.staging.accountId,
	productionAccountId: accounts.production.accountId,
	managementAccountId: organizationConfig.managementAccountId,
})

const topology = createOrganizationTopology({
	provider: managementProvider,
	managementAccountId: organizationConfig.managementAccountId,
	stagingAccountId: accounts.staging.accountId,
	productionAccountId: accounts.production.accountId,
	requestedAccounts: accounts.requested,
	importedAccounts,
	importedPolicies,
})

const stagingGuardrailsProvider = new aws.Provider(
	'guardrails-staging-provider',
	{
		region: organizationConfig.region,
		assumeRoles: [
			{
				roleArn: `arn:aws:iam::${guardrails.staging.accountId}:role/${guardrails.staging.assumeRoleName}`,
				sessionName: 'pulumi-organization-guardrails-staging',
			},
		],
		defaultTags: {
			tags: {
				Environment: guardrails.staging.environment,
				ManagedBy: 'Pulumi',
				Project: 'aamini-stack',
				Scope: 'guardrails',
			},
		},
	},
)

const productionGuardrailsProvider = new aws.Provider(
	'guardrails-production-provider',
	{
		region: organizationConfig.region,
		assumeRoles: [
			{
				roleArn: `arn:aws:iam::${guardrails.production.accountId}:role/${guardrails.production.assumeRoleName}`,
				sessionName: 'pulumi-organization-guardrails-production',
			},
		],
		defaultTags: {
			tags: {
				Environment: guardrails.production.environment,
				ManagedBy: 'Pulumi',
				Project: 'aamini-stack',
				Scope: 'guardrails',
			},
		},
	},
)

const accountGuardrails = {
	staging: createAccountGuardrails({
		provider: stagingGuardrailsProvider,
		managementAccountId: organizationConfig.managementAccountId,
		ciCdPrincipalArn: guardrails.ciCdPrincipalArn,
		deploymentPrincipalArns: guardrails.deploymentPrincipalArns,
		billingAlertEmail: guardrails.billingAlertEmail,
		account: guardrails.staging,
	}),
	production: createAccountGuardrails({
		provider: productionGuardrailsProvider,
		managementAccountId: organizationConfig.managementAccountId,
		ciCdPrincipalArn: guardrails.ciCdPrincipalArn,
		deploymentPrincipalArns: guardrails.deploymentPrincipalArns,
		billingAlertEmail: guardrails.billingAlertEmail,
		account: guardrails.production,
	}),
}

export const workloadAccess = {
	region: organizationConfig.region,
	staging: {
		accountId: accounts.staging.accountId,
		assumeRoleName: guardrails.staging.assumeRoleName,
		organizationAccessRoleArn: accountGuardrails.staging.providerRoleArn,
		pulumiDeployRoleArn: accountGuardrails.staging.pulumiDeployRoleArn,
	},
	production: {
		accountId: accounts.production.accountId,
		assumeRoleName: guardrails.production.assumeRoleName,
		organizationAccessRoleArn: accountGuardrails.production.providerRoleArn,
		pulumiDeployRoleArn: accountGuardrails.production.pulumiDeployRoleArn,
	},
}

export const organization = topology.organization

export { identity }

export const organizationStructure = topology.organizationStructure

export const serviceControlPolicies = topology.serviceControlPolicies

export const controltowerOutputs = topology.controltowerOutputs

export const guardrailsOutputs = accountGuardrails
