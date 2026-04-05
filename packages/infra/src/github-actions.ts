import * as azure from '@pulumi/azure-native'
import * as pulumi from '@pulumi/pulumi'

const config = new pulumi.Config()
const azureConfig = new pulumi.Config('azure-native')

const location = azureConfig.require('location')
const subscriptionId = azureConfig.require('subscriptionId')
const resourceGroupName = config.require('resourceGroupName')
const githubRepositoryName = config.require('githubRepositoryName')

const githubOidcSubject =
	config.get('githubOidcSubject') ??
	`repo:aamini-stack/${githubRepositoryName}:ref:refs/heads/main`

const githubActionsIdentity = new azure.managedidentity.UserAssignedIdentity(
	'github-actions-identity',
	{
		location,
		resourceGroupName,
	},
)

new azure.managedidentity.FederatedIdentityCredential(
	'github-actions-federation',
	{
		resourceGroupName,
		resourceName: githubActionsIdentity.name,
		federatedIdentityCredentialResourceName: 'github-main',
		issuer: 'https://token.actions.githubusercontent.com',
		audiences: ['api://AzureADTokenExchange'],
		subject: githubOidcSubject,
	},
)

new azure.authorization.RoleAssignment('github-actions-contributor', {
	principalId: githubActionsIdentity.principalId,
	principalType: 'ServicePrincipal',
	roleDefinitionId: `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c`,
	scope: `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}`,
})

export const githubActionsClientId = githubActionsIdentity.clientId
export const githubActionsPrincipalId = githubActionsIdentity.principalId
