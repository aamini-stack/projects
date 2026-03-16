import * as aws from '@pulumi/aws'
import * as eks from '@pulumi/eks'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import { repositoryArns } from './ecr'

interface KubernetesConfig {
	clusterName?: string
	version?: string
	instanceType?: string
	desiredCapacity?: number
	minSize?: number
	maxSize?: number
	vpcId?: string
	subnetIds?: string[]
	availabilityZones?: string[]
	endpointPublicAccess?: boolean
	endpointPrivateAccess?: boolean
}

interface FluxConfig {
	ociRepository: string
	ociTag: string
}

interface FluxOperatorConfig {
	githubRepository: string
	githubSecretName: string
}

const defaultFluxConfig: FluxConfig = {
	ociRepository:
		'oci://302481198387.dkr.ecr.us-east-1.amazonaws.com/projects-gitops',
	ociTag: 'latest',
}

const defaultFluxOperatorConfig: FluxOperatorConfig = {
	githubRepository: 'aamini-stack/projects',
	githubSecretName: 'github-operator-auth',
}

const config = new pulumi.Config()
const kubernetesConfig = config.getObject<KubernetesConfig>('kubernetes') ?? {}
const enabled = true
const stack = pulumi.getStack()
const defaultVpc = aws.ec2.getVpcOutput({ default: true })
const resolvedVpcId = pulumi.output(kubernetesConfig.vpcId ?? defaultVpc.id)
const selectedAzs = kubernetesConfig.availabilityZones ?? [
	'us-east-1a',
	'us-east-1b',
	'us-east-1c',
	'us-east-1d',
	'us-east-1f',
]
const defaultSubnets = aws.ec2.getSubnetsOutput({
	filters: [
		{ name: 'vpc-id', values: [resolvedVpcId] },
		{ name: 'availability-zone', values: selectedAzs },
	],
})
const resolvedSubnetIds = pulumi.output(
	kubernetesConfig.subnetIds ?? defaultSubnets.ids,
)

const cluster = new eks.Cluster('kubernetes', {
	name: kubernetesConfig.clusterName ?? `aamini-${stack}`,
	version: kubernetesConfig.version ?? '1.31',
	vpcId: resolvedVpcId,
	subnetIds: resolvedSubnetIds,
	instanceType: kubernetesConfig.instanceType ?? 't3.large',
	desiredCapacity: kubernetesConfig.desiredCapacity ?? 2,
	minSize: kubernetesConfig.minSize ?? 1,
	maxSize: kubernetesConfig.maxSize ?? 3,
	endpointPublicAccess: kubernetesConfig.endpointPublicAccess ?? true,
	endpointPrivateAccess: kubernetesConfig.endpointPrivateAccess ?? false,
	createOidcProvider: true,
	tags: {
		ManagedBy: 'pulumi',
		Environment: stack,
	},
})

const githubConfig = new pulumi.Config('github')
const cloudflareConfig = new pulumi.Config('cloudflare')
const githubToken = githubConfig.getSecret('token') ?? pulumi.secret('')
const cloudflareApiToken =
	cloudflareConfig.getSecret('apiToken') ?? pulumi.secret('')

const fluxConfig = {
	...defaultFluxConfig,
	...(config.getObject<Partial<FluxConfig>>('flux') ?? {}),
}

const fluxOperatorConfig = {
	...defaultFluxOperatorConfig,
	...(config.getObject<Partial<FluxOperatorConfig>>('fluxOperator') ?? {}),
}

const k8sProvider = cluster.provider

const fluxNamespace = new k8s.core.v1.Namespace(
	'flux-system',
	{
		metadata: {
			name: 'flux-system',
		},
	},
	{ provider: k8sProvider },
)

const fluxInstanceValues = {
	instance: {
		distribution: {
			version: '2.x',
			registry: 'ghcr.io/fluxcd',
			artifact: 'oci://ghcr.io/controlplaneio-fluxcd/flux-operator-manifests',
		},
		components: [
			'source-controller',
			'kustomize-controller',
			'helm-controller',
			'notification-controller',
			'image-reflector-controller',
			'image-automation-controller',
		],
		cluster: {
			type: 'kubernetes',
			multitenant: false,
			networkPolicy: true,
			domain: 'cluster.local',
		},
		sync: {
			kind: 'OCIRepository',
			url: fluxConfig.ociRepository,
			ref: fluxConfig.ociTag,
			path: './bootstrap',
			provider: 'aws',
		},
	},
}

const fluxOperator = new k8s.helm.v3.Release(
	'flux-operator',
	{
		chart: 'oci://ghcr.io/controlplaneio-fluxcd/charts/flux-operator',
		namespace: fluxNamespace.metadata.name,
		createNamespace: false,
	},
	{ provider: k8sProvider, dependsOn: [fluxNamespace] },
)

const fluxInstance = new k8s.helm.v3.Release(
	'flux-instance',
	{
		chart: 'oci://ghcr.io/controlplaneio-fluxcd/charts/flux-instance',
		namespace: fluxNamespace.metadata.name,
		createNamespace: false,
		values: fluxInstanceValues,
	},
	{ provider: k8sProvider, dependsOn: [fluxNamespace, fluxOperator] },
)

const oidcProvider = cluster.core?.oidcProvider
if (!oidcProvider) {
	throw new Error('OIDC provider is required for Flux ECR auth.')
}

const oidcProviderArn = oidcProvider.apply((provider) => {
	if (!provider) {
		throw new Error('OIDC provider is required for Flux ECR auth.')
	}

	return provider.arn
})
const oidcProviderUrl = oidcProvider
	.apply((provider) => {
		if (!provider) {
			throw new Error('OIDC provider is required for Flux ECR auth.')
		}

		return provider.url
	})
	.apply((url) => url.replace('https://', ''))

const fluxEcrReadRole = new aws.iam.Role('flux-ecr-read-role', {
	name: 'flux-ecr-readonly',
	assumeRolePolicy: pulumi
		.all([oidcProviderArn, oidcProviderUrl])
		.apply(([providerArn, providerUrl]) =>
			JSON.stringify({
				Version: '2012-10-17',
				Statement: [
					{
						Effect: 'Allow',
						Principal: {
							Federated: providerArn,
						},
						Action: 'sts:AssumeRoleWithWebIdentity',
						Condition: {
							StringEquals: {
								[`${providerUrl}:aud`]: 'sts.amazonaws.com',
								[`${providerUrl}:sub`]: [
									'system:serviceaccount:flux-system:source-controller',
									'system:serviceaccount:flux-system:image-reflector-controller',
								],
							},
						},
					},
				],
			}),
		),
})

new aws.iam.RolePolicy('flux-ecr-read-policy', {
	role: fluxEcrReadRole.id,
	policy: pulumi
		.all([
			repositoryArns.imdbgraph,
			repositoryArns.portfolio,
			repositoryArns['pc-tune-ups'],
			repositoryArns['dota-visualizer'],
			repositoryArns['app-release'],
			repositoryArns['projects-gitops'],
		])
		.apply((arns) =>
			JSON.stringify({
				Version: '2012-10-17',
				Statement: [
					{
						Effect: 'Allow',
						Action: ['ecr:GetAuthorizationToken'],
						Resource: '*',
					},
					{
						Effect: 'Allow',
						Action: [
							'ecr:BatchCheckLayerAvailability',
							'ecr:BatchGetImage',
							'ecr:DescribeImages',
							'ecr:DescribeRepositories',
							'ecr:GetDownloadUrlForLayer',
							'ecr:ListImages',
						],
						Resource: arns,
					},
				],
			}),
		),
})

new k8s.core.v1.ServiceAccountPatch(
	'flux-source-controller-irsa',
	{
		metadata: {
			name: 'source-controller',
			namespace: fluxNamespace.metadata.name,
			annotations: {
				'eks.amazonaws.com/role-arn': fluxEcrReadRole.arn,
			},
		},
	},
	{ provider: k8sProvider, dependsOn: [fluxInstance] },
)

new k8s.core.v1.ServiceAccountPatch(
	'flux-image-reflector-controller-irsa',
	{
		metadata: {
			name: 'image-reflector-controller',
			namespace: fluxNamespace.metadata.name,
			annotations: {
				'eks.amazonaws.com/role-arn': fluxEcrReadRole.arn,
			},
		},
	},
	{ provider: k8sProvider, dependsOn: [fluxInstance] },
)

new k8s.core.v1.Secret(
	'networking-secrets',
	{
		metadata: {
			name: 'networking-secrets',
			namespace: fluxNamespace.metadata.name,
		},
		stringData: {
			CLOUDFLARE_API_TOKEN: cloudflareApiToken,
		},
	},
	{ provider: k8sProvider, dependsOn: [fluxNamespace] },
)

new k8s.core.v1.Secret(
	'github-operator-auth',
	{
		metadata: {
			name: fluxOperatorConfig.githubSecretName,
			namespace: fluxNamespace.metadata.name,
		},
		stringData: {
			username: 'flux',
			password: githubToken,
		},
	},
	{ provider: k8sProvider, dependsOn: [fluxNamespace] },
)

const kubeconfig = pulumi.secret(cluster.kubeconfig)
const clusterArn = cluster.eksCluster.arn
const clusterName = cluster.eksCluster.name

export { enabled, kubeconfig, clusterArn, clusterName }
