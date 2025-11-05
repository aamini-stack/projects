import { Chart, ChartProps } from 'cdk8s'
import { Construct } from 'constructs'
import * as k8s from '@/imports/k8s'
import * as source from '@/imports/source.toolkit.fluxcd.io'
import * as helm from '@/imports/helm.toolkit.fluxcd.io'

export class PackagesChart extends Chart {
	constructor(scope: Construct, id: string, props: ChartProps = {}) {
		super(scope, id, props)

		// Networking Namespace
		new k8s.KubeNamespace(this, 'networking-namespace', {
			metadata: {
				name: 'networking',
			},
		})

		// Cert-Manager HelmRepository
		new source.HelmRepository(this, 'cert-manager-repo', {
			metadata: {
				name: 'cert-manager',
				namespace: 'flux-system',
			},
			spec: {
				interval: '10m',
				url: 'https://charts.jetstack.io',
			},
		})

		// Cert-Manager HelmRelease
		new helm.HelmRelease(this, 'cert-manager-release', {
			metadata: {
				name: 'cert-manager',
				namespace: 'networking',
			},
			spec: {
				interval: '10m',
				chart: {
					spec: {
						chart: 'cert-manager',
						version: '1.x',
						sourceRef: {
							kind: helm.HelmReleaseSpecChartSpecSourceRefKind.HELM_REPOSITORY,
							name: 'cert-manager',
							namespace: 'flux-system',
						},
					},
				},
				values: {
					installCRDs: true,
					extraArgs: ['--enable-gateway-api'],
				},
			},
		})

		// Traefik HelmRepository
		new source.HelmRepository(this, 'traefik-repo', {
			metadata: {
				name: 'traefik',
				namespace: 'flux-system',
			},
			spec: {
				interval: '10m',
				url: 'https://traefik.github.io/charts',
			},
		})

		// Traefik HelmRelease
		new helm.HelmRelease(this, 'traefik-release', {
			metadata: {
				name: 'traefik',
				namespace: 'networking',
			},
			spec: {
				interval: '10m',
				chart: {
					spec: {
						chart: 'traefik',
						sourceRef: {
							kind: helm.HelmReleaseSpecChartSpecSourceRefKind.HELM_REPOSITORY,
							name: 'traefik',
							namespace: 'flux-system',
						},
					},
				},
				values: {
					providers: {
						kubernetesGateway: {
							enabled: true,
						},
					},
					gateway: {
						enabled: false,
					},
				},
			},
		})

		// Sealed Secrets HelmRepository
		new source.HelmRepository(this, 'sealed-secrets-repo', {
			metadata: {
				name: 'sealed-secrets',
				namespace: 'flux-system',
			},
			spec: {
				interval: '1h',
				url: 'https://bitnami-labs.github.io/sealed-secrets',
			},
		})

		// Sealed Secrets HelmRelease
		new helm.HelmRelease(this, 'sealed-secrets-release', {
			metadata: {
				name: 'sealed-secrets',
				namespace: 'kube-system',
			},
			spec: {
				interval: '1h',
				chart: {
					spec: {
						chart: 'sealed-secrets',
						sourceRef: {
							kind: helm.HelmReleaseSpecChartSpecSourceRefKind.HELM_REPOSITORY,
							name: 'sealed-secrets',
							namespace: 'flux-system',
						},
					},
				},
				values: {
					fullnameOverride: 'sealed-secrets-controller',
				},
			},
		})
	}
}
