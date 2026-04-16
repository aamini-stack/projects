import * as azure from '@pulumi/azure-native'
import * as pulumi from '@pulumi/pulumi'

const config = new pulumi.Config()
const azureConfig = new pulumi.Config('azure-native')

const location = azureConfig.require('location')
const resourceGroupName = config.require('resourceGroupName')

export const resourceGroup = new azure.resources.ResourceGroup(
	'resource-group',
	{
		location,
		resourceGroupName,
	},
)
