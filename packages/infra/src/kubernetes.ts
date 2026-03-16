import * as aws from '@pulumi/aws'
import * as cloudflare from '@pulumi/cloudflare'
import * as command from '@pulumi/command'
import * as eks from '@pulumi/eks'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import { repositoryArns } from './ecr'
import {
	postgresAdminPassword,
	postgresAdminUser,
	postgresHost,
	postgresPort,
} from './postgres'

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

interface DnsAutomationConfig {
	enabled?: boolean
	rootDomain?: string
	zoneId?: string
	traefikNamespace?: string
	traefikServiceName?: string
	proxied?: boolean
	ttl?: number
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
const appsConfig = new pulumi.Config('apps')
const githubToken = githubConfig.getSecret('token') ?? pulumi.secret('')
const cloudflareApiToken =
	cloudflareConfig.getSecret('apiToken') ?? pulumi.secret('')
const imdbgraphCronSecret =
	appsConfig.getSecret('imdbgraphCronSecret') ?? pulumi.secret('change-me')
const imdbgraphDatabaseName =
	appsConfig.get('imdbgraphDatabaseName') ?? 'postgres'
const dnsAutomationConfig =
	cloudflareConfig.getObject<DnsAutomationConfig>('dnsAutomation') ?? {}

const fluxConfig = {
	...defaultFluxConfig,
	...config.getObject<Partial<FluxConfig>>('flux'),
}

const fluxOperatorConfig = {
	...defaultFluxOperatorConfig,
	...config.getObject<Partial<FluxOperatorConfig>>('fluxOperator'),
}

const dnsAutomationEnabled = dnsAutomationConfig.enabled ?? true
const rootDomain = dnsAutomationConfig.rootDomain ?? 'ariaamini.com'
const traefikNamespace = dnsAutomationConfig.traefikNamespace ?? 'networking'
const traefikServiceName = dnsAutomationConfig.traefikServiceName ?? 'traefik'
const dnsProxied = dnsAutomationConfig.proxied ?? true
const dnsTtl = dnsAutomationConfig.ttl ?? 1

const k8sProvider = cluster.provider
const kubeconfigValue = cluster.kubeconfig.apply((value) =>
	typeof value === 'string' ? value : JSON.stringify(value),
)

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

new command.local.Command(
	'flux-finalizer-cleanup',
	{
		create: 'true',
		delete:
			'bash -c \'set -euo pipefail; tmp_kubeconfig=$(mktemp); trap "rm -f $tmp_kubeconfig" EXIT; printf "%s" "$PULUMI_KUBECONFIG" > "$tmp_kubeconfig"; export KUBECONFIG="$tmp_kubeconfig"; for resource in resourcesets.fluxcd.controlplane.io resourcesetinputproviders.fluxcd.controlplane.io; do names=$(kubectl get "$resource" -n flux-system -o name 2>/dev/null || true); for name in $names; do kubectl patch -n flux-system "$name" --type merge -p "{\\"metadata\\":{\\"finalizers\\":[]}}" >/dev/null 2>&1 || true; kubectl delete -n flux-system "$name" --ignore-not-found=true >/dev/null 2>&1 || true; done; done\'',
		environment: {
			PULUMI_KUBECONFIG: kubeconfigValue,
		},
	},
	{ dependsOn: [fluxNamespace, fluxInstance] },
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

const ensureImdbgraphNamespace = new command.local.Command(
	'ensure-imdbgraph-namespace',
	{
		create:
			'bash -c \'set -euo pipefail; tmp_kubeconfig=$(mktemp); trap "rm -f $tmp_kubeconfig" EXIT; printf "%s" "$PULUMI_KUBECONFIG" > "$tmp_kubeconfig"; export KUBECONFIG="$tmp_kubeconfig"; kubectl create namespace imdbgraph --dry-run=client -o yaml | kubectl apply -f -\'',
		delete: 'true',
		environment: {
			PULUMI_KUBECONFIG: kubeconfigValue,
		},
	},
	{ dependsOn: [fluxInstance] },
)

const ensureAppPreviewNamespace = new command.local.Command(
	'ensure-app-preview-namespace',
	{
		create:
			'bash -c \'set -euo pipefail; tmp_kubeconfig=$(mktemp); trap "rm -f $tmp_kubeconfig" EXIT; printf "%s" "$PULUMI_KUBECONFIG" > "$tmp_kubeconfig"; export KUBECONFIG="$tmp_kubeconfig"; kubectl create namespace app-preview --dry-run=client -o yaml | kubectl apply -f -\'',
		delete: 'true',
		environment: {
			PULUMI_KUBECONFIG: kubeconfigValue,
		},
	},
	{ dependsOn: [fluxInstance] },
)

const imdbgraphDatabaseUrl = pulumi
	.all([postgresAdminUser, postgresAdminPassword, postgresHost, postgresPort])
	.apply(
		([adminUser, adminPassword, host, port]) =>
			`postgresql://${encodeURIComponent(adminUser)}:${encodeURIComponent(
				adminPassword,
			)}@${host}:${port}/${imdbgraphDatabaseName}?sslmode=require`,
	)

new k8s.core.v1.Secret(
	'imdbgraph-secrets-stable',
	{
		metadata: {
			name: 'imdbgraph-secrets',
			namespace: 'imdbgraph',
		},
		stringData: {
			DATABASE_URL: imdbgraphDatabaseUrl,
			CRON_SECRET: imdbgraphCronSecret,
			NODE_ENV: 'production',
		},
	},
	{ provider: k8sProvider, dependsOn: [ensureImdbgraphNamespace] },
)

new k8s.core.v1.Secret(
	'imdbgraph-secrets-preview',
	{
		metadata: {
			name: 'imdbgraph-secrets',
			namespace: 'app-preview',
		},
		stringData: {
			DATABASE_URL: imdbgraphDatabaseUrl,
			CRON_SECRET: imdbgraphCronSecret,
			NODE_ENV: 'production',
		},
	},
	{ provider: k8sProvider, dependsOn: [ensureAppPreviewNamespace] },
)

let traefikLoadBalancerHostname: pulumi.Output<string> | undefined

if (dnsAutomationEnabled) {
	const cloudflareProvider = new cloudflare.Provider('cloudflare-provider', {
		apiToken: cloudflareApiToken,
	})

	const zoneId =
		dnsAutomationConfig.zoneId !== undefined
			? pulumi.output(dnsAutomationConfig.zoneId)
			: cloudflare.getZoneOutput(
					{
						filter: {
							name: rootDomain,
							match: 'all',
						},
					},
					{ provider: cloudflareProvider },
				).zoneId

	const traefikLbHostname = new command.local.Command(
		'traefik-loadbalancer-hostname',
		{
			create:
				'bash -c \'set -euo pipefail; tmp_kubeconfig=$(mktemp); trap "rm -f $tmp_kubeconfig" EXIT; printf "%s" "$PULUMI_KUBECONFIG" > "$tmp_kubeconfig"; export KUBECONFIG="$tmp_kubeconfig"; timeout_seconds=1800; start=$(date +%s); while true; do hostname=$(kubectl get svc "$TRAEFIK_SERVICE_NAME" -n "$TRAEFIK_NAMESPACE" -o jsonpath="{.status.loadBalancer.ingress[0].hostname}" 2>/dev/null || true); if [ -n "$hostname" ]; then printf "%s" "$hostname"; exit 0; fi; now=$(date +%s); elapsed=$((now-start)); if [ "$elapsed" -ge "$timeout_seconds" ]; then echo "Timed out waiting for Traefik load balancer hostname" >&2; exit 1; fi; sleep 10; done\'',
			delete: 'true',
			environment: {
				PULUMI_KUBECONFIG: kubeconfigValue,
				TRAEFIK_NAMESPACE: traefikNamespace,
				TRAEFIK_SERVICE_NAME: traefikServiceName,
			},
		},
		{ dependsOn: [fluxInstance] },
	)

	const resolvedTraefikLoadBalancerHostname = traefikLbHostname.stdout.apply(
		(stdout) => stdout.trim(),
	)
	traefikLoadBalancerHostname = resolvedTraefikLoadBalancerHostname

	const upsertDnsRecord = (
		resourceName: string,
		dnsName: string,
		dependsOn: pulumi.Input<pulumi.Resource>[],
	) => {
		const cleanupConflictingDns = new command.local.Command(
			`${resourceName}-cleanup`,
			{
				create: `bash -c 'set -euo pipefail; python3 - <<"PY"
import json
import os
import urllib.parse
import urllib.request

token = os.environ["CLOUDFLARE_API_TOKEN"]
zone_id = os.environ["CLOUDFLARE_ZONE_ID"]
dns_name = os.environ["CLOUDFLARE_DNS_NAME"]

query = urllib.parse.urlencode({"name": dns_name})
list_url = "https://api.cloudflare.com/client/v4/zones/" + zone_id + "/dns_records?" + query
list_req = urllib.request.Request(
    list_url,
    headers={
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
    },
)

with urllib.request.urlopen(list_req) as resp:
    payload = json.loads(resp.read().decode())

for record in payload.get("result", []):
    if record.get("type") not in {"A", "AAAA", "CNAME"}:
        continue
    delete_url = "https://api.cloudflare.com/client/v4/zones/" + zone_id + "/dns_records/" + record["id"]
    delete_req = urllib.request.Request(
        delete_url,
        method="DELETE",
        headers={
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(delete_req) as resp:
        result = json.loads(resp.read().decode())
        if not result.get("success"):
            raise RuntimeError("Failed deleting DNS record " + record["id"] + ": " + json.dumps(result))
PY
'`,
				delete: 'true',
				environment: {
					CLOUDFLARE_API_TOKEN: cloudflareApiToken,
					CLOUDFLARE_ZONE_ID: zoneId,
					CLOUDFLARE_DNS_NAME: dnsName,
				},
			},
			{ dependsOn },
		)

		return new cloudflare.DnsRecord(
			resourceName,
			{
				zoneId,
				name: dnsName,
				type: 'CNAME',
				content: resolvedTraefikLoadBalancerHostname,
				proxied: dnsProxied,
				ttl: dnsTtl,
			},
			{
				provider: cloudflareProvider,
				dependsOn: [cleanupConflictingDns],
			},
		)
	}

	upsertDnsRecord('root-domain-dns', rootDomain, [traefikLbHostname])
	upsertDnsRecord('wildcard-root-domain-dns', `*.${rootDomain}`, [
		traefikLbHostname,
	])
	upsertDnsRecord('preview-wildcard-domain-dns', `*.preview.${rootDomain}`, [
		traefikLbHostname,
	])
}

const clusterArn = cluster.eksCluster.arn
const clusterName = cluster.eksCluster.name
const kubeconfig = pulumi.secret(kubeconfigValue)

export {
	enabled,
	kubeconfig,
	clusterArn,
	clusterName,
	traefikLoadBalancerHostname,
}
