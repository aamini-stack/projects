import * as azure from '@pulumi/azure-native'
import * as pulumi from '@pulumi/pulumi'

const azureConfig = new pulumi.Config('azure-native')

const resourceGroup = new azure.resources.ResourceGroup('rg-aamini-staging', {
	resourceGroupName: azureConfig.require('resourceGroup'),
	location: azureConfig.require('location'),
})

export const resourceGroupName = resourceGroup.name
export const location = resourceGroup.location
