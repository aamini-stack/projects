import * as azure from '@pulumi/azure-native'
import * as pulumi from '@pulumi/pulumi'

import { resourceGroup } from './resource-groups'

const config = new pulumi.Config()
const azureConfig = new pulumi.Config('azure-native')

const location = azureConfig.require('location')
const subscriptionId = azureConfig.require('subscriptionId')
const githubOrganizationName = config.require('githubOrganizationName')
const githubRepositoryName = config.require('githubRepositoryName')

const githubOidcSubject = config.get('githubOidcSubject')
const githubOidcSubjects =
	config.getObject<string[]>('githubOidcSubjects') ??
	(githubOidcSubject
		? [githubOidcSubject]
		: [
				`repo:${githubOrganizationName}/${githubRepositoryName}:ref:refs/heads/main`,
				`repo:${githubOrganizationName}/${githubRepositoryName}:pull_request`,
			])
const [mainGithubOidcSubject, ...additionalGithubOidcSubjects] =
	githubOidcSubjects

const githubActionsIdentity = new azure.managedidentity.UserAssignedIdentity(
	'github-actions-identity',
	{
		location,
		resourceGroupName: resourceGroup.name,
	},
)

if (mainGithubOidcSubject) {
	new azure.managedidentity.FederatedIdentityCredential(
		'github-actions-federation',
		{
			resourceGroupName: resourceGroup.name,
			resourceName: githubActionsIdentity.name,
			federatedIdentityCredentialResourceName: 'github-main',
			issuer: 'https://token.actions.githubusercontent.com',
			audiences: ['api://AzureADTokenExchange'],
			subject: mainGithubOidcSubject,
		},
		{ dependsOn: [githubActionsIdentity] },
	)
}

additionalGithubOidcSubjects.forEach((subject, index) => {
	new azure.managedidentity.FederatedIdentityCredential(
		`github-actions-federation-${index + 1}`,
		{
			resourceGroupName: resourceGroup.name,
			resourceName: githubActionsIdentity.name,
			federatedIdentityCredentialResourceName: `github-${index + 1}`,
			issuer: 'https://token.actions.githubusercontent.com',
			audiences: ['api://AzureADTokenExchange'],
			subject,
		},
		{ dependsOn: [githubActionsIdentity] },
	)
})

new azure.authorization.RoleAssignment(
	'github-actions-contributor',
	{
		principalId: githubActionsIdentity.principalId,
		principalType: 'ServicePrincipal',
		roleDefinitionId: `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c`,
		scope: resourceGroup.id,
	},
	{ dependsOn: [githubActionsIdentity] },
)

export const githubActionsClientId = githubActionsIdentity.clientId
export const githubActionsPrincipalId = githubActionsIdentity.principalId
