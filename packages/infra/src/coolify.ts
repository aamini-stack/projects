import * as azure from '@pulumi/azure-native'
import * as pulumi from '@pulumi/pulumi'
import * as tls from '@pulumi/tls'

const config = new pulumi.Config('azure-native')

const location = config.require('location')

// Create dedicated resource group for Coolify
const resourceGroup = new azure.resources.ResourceGroup('coolify-rg', {
	resourceGroupName: 'rg-coolify-prod',
	location: location,
})

// Generate SSH key pair for VM access
const sshKey = new tls.PrivateKey('coolify-ssh-key', {
	algorithm: 'RSA',
	rsaBits: 4096,
})

// Virtual Network for Coolify VM
const vnet = new azure.network.VirtualNetwork('coolify-vnet', {
	virtualNetworkName: 'coolify-vnet',
	resourceGroupName: resourceGroup.name,
	location: location,
	addressSpace: {
		addressPrefixes: ['10.0.0.0/16'],
	},
})

// Subnet for Coolify VM
const subnet = new azure.network.Subnet('coolify-subnet', {
	subnetName: 'coolify-subnet',
	resourceGroupName: resourceGroup.name,
	virtualNetworkName: vnet.name,
	addressPrefix: '10.0.1.0/24',
})

// Public IP for Coolify VM
const publicIp = new azure.network.PublicIPAddress('coolify-public-ip', {
	publicIpAddressName: 'coolify-public-ip',
	resourceGroupName: resourceGroup.name,
	location: location,
	publicIPAllocationMethod: 'Static',
	sku: {
		name: 'Standard',
	},
})

// Network Security Group with rules for SSH, HTTP, HTTPS, and Coolify
const nsg = new azure.network.NetworkSecurityGroup('coolify-nsg', {
	networkSecurityGroupName: 'coolify-nsg',
	resourceGroupName: resourceGroup.name,
	location: location,
	securityRules: [
		{
			name: 'SSH',
			priority: 1000,
			direction: 'Inbound',
			access: 'Allow',
			protocol: 'Tcp',
			sourcePortRange: '*',
			destinationPortRange: '22',
			sourceAddressPrefix: '*',
			destinationAddressPrefix: '*',
		},
		{
			name: 'HTTP',
			priority: 1001,
			direction: 'Inbound',
			access: 'Allow',
			protocol: 'Tcp',
			sourcePortRange: '*',
			destinationPortRange: '80',
			sourceAddressPrefix: '*',
			destinationAddressPrefix: '*',
		},
		{
			name: 'HTTPS',
			priority: 1002,
			direction: 'Inbound',
			access: 'Allow',
			protocol: 'Tcp',
			sourcePortRange: '*',
			destinationPortRange: '443',
			sourceAddressPrefix: '*',
			destinationAddressPrefix: '*',
		},
		{
			name: 'Coolify',
			priority: 1003,
			direction: 'Inbound',
			access: 'Allow',
			protocol: 'Tcp',
			sourcePortRange: '*',
			destinationPortRange: '8000',
			sourceAddressPrefix: '*',
			destinationAddressPrefix: '*',
		},
		{
			name: 'Coolify-6001',
			priority: 1004,
			direction: 'Inbound',
			access: 'Allow',
			protocol: 'Tcp',
			sourcePortRange: '*',
			destinationPortRange: '6001',
			sourceAddressPrefix: '*',
			destinationAddressPrefix: '*',
		},
		{
			name: 'Coolify-6002',
			priority: 1005,
			direction: 'Inbound',
			access: 'Allow',
			protocol: 'Tcp',
			sourcePortRange: '*',
			destinationPortRange: '6002',
			sourceAddressPrefix: '*',
			destinationAddressPrefix: '*',
		},
	],
})

// Network Interface for Coolify VM
const nic = new azure.network.NetworkInterface('coolify-nic', {
	networkInterfaceName: 'coolify-nic',
	resourceGroupName: resourceGroup.name,
	location: location,
	ipConfigurations: [
		{
			name: 'coolify-ipconfig',
			subnet: {
				id: subnet.id,
			},
			publicIPAddress: {
				id: publicIp.id,
			},
			privateIPAllocationMethod: 'Dynamic',
		},
	],
	networkSecurityGroup: {
		id: nsg.id,
	},
})

// Cloud-init configuration to install Coolify
const cloudInit = `#cloud-config
package_update: true
package_upgrade: true

packages:
  - curl

runcmd:
  # Install Coolify
  - curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

  # Wait for Coolify to be ready
  - echo "Coolify installation started. Access at http://$(curl -s ifconfig.me):8000"
`

// Coolify VM
const coolifyVm = new azure.compute.VirtualMachine('coolify-vm', {
	vmName: 'coolify-vm',
	resourceGroupName: resourceGroup.name,
	location: location,
	hardwareProfile: {
		vmSize: 'Standard_B2s', // 2 vCPU, 4 GB RAM
	},
	networkProfile: {
		networkInterfaces: [
			{
				id: nic.id,
				primary: true,
			},
		],
	},
	osProfile: {
		computerName: 'coolify',
		adminUsername: 'azureuser',
		customData: Buffer.from(cloudInit).toString('base64'),
		linuxConfiguration: {
			disablePasswordAuthentication: true,
			ssh: {
				publicKeys: [
					{
						path: '/home/azureuser/.ssh/authorized_keys',
						keyData: sshKey.publicKeyOpenssh,
					},
				],
			},
		},
	},
	storageProfile: {
		imageReference: {
			publisher: 'Canonical',
			offer: '0001-com-ubuntu-server-jammy',
			sku: '22_04-lts-gen2',
			version: 'latest',
		},
		osDisk: {
			name: 'coolify-os-disk',
			createOption: 'FromImage',
			managedDisk: {
				storageAccountType: 'Premium_LRS',
			},
			diskSizeGB: 30,
		},
	},
})

// Exports
export const coolifyResourceGroupName = resourceGroup.name
export const coolifyPublicIp = publicIp.ipAddress
export const coolifyUrl = publicIp.ipAddress.apply((ip) => `http://${ip}:8000`)
export const coolifyPrivateKey = pulumi.secret(sshKey.privateKeyPem)
export const coolifyPublicKey = sshKey.publicKeyOpenssh
export const coolifyVmId = coolifyVm.id
export const coolifyVmName = coolifyVm.name
export const coolifyConnectionString = publicIp.ipAddress.apply(
	(ip) => `ssh -i coolify-private-key.pem azureuser@${ip}`,
)
