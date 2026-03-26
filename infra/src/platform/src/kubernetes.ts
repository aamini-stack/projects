import * as aws from '@pulumi/aws'
import * as eks from '@pulumi/eks'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import { workloadInvokeOptions, workloadProvider } from './provider.ts'

export const createCluster = (awsProvider: aws.Provider) => {
	type KubernetesConfig = {
		version: string
		instanceType: string
		desiredCapacity: number
		minSize: number
		maxSize: number
	}

	type ClusterOutputs = {
		cluster: eks.Cluster
		k8sProvider: k8s.Provider
		kubeconfigValue: pulumi.Output<string>
		kubeconfig: pulumi.Output<string>
		clusterArn: pulumi.Output<string>
		clusterName: pulumi.Output<string>
		vpcId: pulumi.Output<string>
		subnetIds: pulumi.Output<string[]>
		oidcProviderArn: pulumi.Output<string>
		oidcProviderUrl: pulumi.Output<string>
	}

	const stack = pulumi.getStack()
	const config = new pulumi.Config()
	const kubernetesConfig = config.requireObject<KubernetesConfig>('kubernetes')

	const resolvedVpcId = pulumi.output(
		aws.ec2.getVpcOutput({ default: true }, workloadInvokeOptions).id,
	)
	const resolvedSubnetIds = pulumi.output(
		aws.ec2.getSubnetsOutput(
			{
				filters: [
					{ name: 'vpc-id', values: [resolvedVpcId] },
					{
						name: 'availability-zone',
						values: [
							'us-east-1a',
							'us-east-1b',
							'us-east-1c',
							'us-east-1d',
							'us-east-1f',
						],
					},
				],
			},
			workloadInvokeOptions,
		).ids,
	)

	const cluster = new eks.Cluster(
		'kubernetes',
		{
			name: `aamini-${stack}`,
			version: kubernetesConfig.version,
			vpcId: resolvedVpcId,
			subnetIds: resolvedSubnetIds,
			instanceType: kubernetesConfig.instanceType,
			desiredCapacity: kubernetesConfig.desiredCapacity,
			minSize: kubernetesConfig.minSize,
			maxSize: kubernetesConfig.maxSize,
			endpointPublicAccess: true,
			endpointPrivateAccess: false,
			corednsAddonOptions: {
				enabled: false,
			},
			createOidcProvider: true,
			tags: {
				ManagedBy: 'pulumi',
				Environment: stack,
			},
		},
		{
			providers: {
				aws: awsProvider,
			},
		},
	)

	new aws.eks.Addon(
		'kubernetes-coredns',
		{
			clusterName: cluster.eksCluster.name,
			addonName: 'coredns',
			resolveConflictsOnCreate: 'OVERWRITE',
			resolveConflictsOnUpdate: 'OVERWRITE',
		},
		{ dependsOn: [cluster], provider: awsProvider },
	)

	const kubeconfigValue = cluster.kubeconfig.apply((value) =>
		typeof value === 'string' ? value : JSON.stringify(value),
	)

	const k8sProvider = new k8s.Provider(
		'kubernetes-provider',
		{
			kubeconfig: kubeconfigValue,
			clusterIdentifier: cluster.eksCluster.arn,
			deleteUnreachable: true,
			skipUpdateUnreachable: true,
		},
		{ dependsOn: [cluster] },
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

	return {
		cluster,
		k8sProvider,
		kubeconfigValue,
		kubeconfig: pulumi.secret(kubeconfigValue),
		clusterArn: cluster.eksCluster.arn,
		clusterName: cluster.eksCluster.name,
		vpcId: resolvedVpcId,
		subnetIds: resolvedSubnetIds,
		oidcProviderArn,
		oidcProviderUrl,
	} satisfies ClusterOutputs
}

export const createFlux = (
	cluster: ReturnType<typeof createCluster>,
	awsProvider: aws.Provider,
): {
	fluxNamespace: k8s.core.v1.Namespace
	fluxOperator: k8s.helm.v3.Release
	fluxInstance: k8s.helm.v3.Release
	fluxEcrReadRole: aws.iam.Role
} => {
	const githubConfig = new pulumi.Config('github')
	const { k8sProvider, oidcProviderArn, oidcProviderUrl } = cluster

	const fluxNamespace = new k8s.core.v1.Namespace(
		'flux-system',
		{
			metadata: {
				name: 'flux-system',
			},
		},
		{ provider: k8sProvider, deletedWith: cluster.cluster },
	)

	const fluxOperator = new k8s.helm.v3.Release(
		'flux-operator',
		{
			name: 'flux-operator',
			chart: 'oci://ghcr.io/controlplaneio-fluxcd/charts/flux-operator',
			namespace: fluxNamespace.metadata.name,
			createNamespace: false,
			timeout: 900,
			skipAwait: true,
		},
		{
			provider: k8sProvider,
			dependsOn: [fluxNamespace],
			deletedWith: cluster.cluster,
			customTimeouts: { delete: '10m' },
		},
	)

	const fluxInstance = new k8s.helm.v3.Release(
		'flux-instance',
		{
			name: 'flux-instance',
			chart: 'oci://ghcr.io/controlplaneio-fluxcd/charts/flux-instance',
			namespace: fluxNamespace.metadata.name,
			createNamespace: false,
			values: {
				instance: {
					distribution: {
						version: '2.x',
						registry: 'ghcr.io/fluxcd',
						artifact:
							'oci://ghcr.io/controlplaneio-fluxcd/flux-operator-manifests',
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
						url: 'oci://302481198387.dkr.ecr.us-east-1.amazonaws.com/projects-gitops',
						ref: 'latest',
						path: './bootstrap',
						provider: 'aws',
					},
				},
			},
			skipAwait: true,
		},
		{
			provider: k8sProvider,
			dependsOn: [fluxNamespace, fluxOperator],
			deletedWith: cluster.cluster,
			customTimeouts: { delete: '20m' },
		},
	)

	const fluxEcrAssumeRolePolicy = pulumi
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
		)

	const fluxEcrReadRole = new aws.iam.Role(
		'flux-ecr-read-role',
		{
			name: 'flux-ecr-readonly',
			assumeRolePolicy: fluxEcrAssumeRolePolicy,
		},
		{ provider: awsProvider },
	)

	const fluxReadableRepositories = [
		'projects-gitops',
		'app-release',
		'apps',
		'manifests',
	] as const
	const fluxReadableRepositoryArns = fluxReadableRepositories.map(
		(name) =>
			pulumi.interpolate`arn:aws:ecr:${aws.getRegionOutput({}, workloadInvokeOptions).name}:${aws.getCallerIdentityOutput({}, workloadInvokeOptions).accountId}:repository/${name}`,
	)

	new aws.iam.RolePolicy(
		'flux-ecr-read-policy',
		{
			role: fluxEcrReadRole.id,
			policy: pulumi.jsonStringify({
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
						Resource: fluxReadableRepositoryArns,
					},
				],
			}),
		},
		{ provider: awsProvider },
	)

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
		{
			provider: k8sProvider,
			dependsOn: [fluxInstance],
			deletedWith: cluster.cluster,
		},
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
		{
			provider: k8sProvider,
			dependsOn: [fluxInstance],
			deletedWith: cluster.cluster,
		},
	)

	new k8s.core.v1.Secret(
		'github-operator-auth',
		{
			metadata: {
				name: 'github-operator-auth',
				namespace: fluxNamespace.metadata.name,
			},
			stringData: {
				username: 'flux',
				password: githubConfig.requireSecret('token'),
			},
		},
		{
			provider: k8sProvider,
			dependsOn: [fluxNamespace],
			deletedWith: cluster.cluster,
		},
	)

	return {
		fluxNamespace,
		fluxOperator,
		fluxInstance,
		fluxEcrReadRole,
	}
}

const clusterOutputs = createCluster(workloadProvider)
const fluxOutputs = createFlux(clusterOutputs, workloadProvider)

export const kubeconfig = clusterOutputs.kubeconfig
export const clusterArn = clusterOutputs.clusterArn
export const clusterName = clusterOutputs.clusterName
export const vpcId = clusterOutputs.vpcId
export const subnetIds = clusterOutputs.subnetIds
export const oidcProviderArn = clusterOutputs.oidcProviderArn
export const oidcProviderUrl = clusterOutputs.oidcProviderUrl
export const fluxNamespace = fluxOutputs.fluxNamespace.metadata.name
export const fluxEcrReadRoleArn = fluxOutputs.fluxEcrReadRole.arn
