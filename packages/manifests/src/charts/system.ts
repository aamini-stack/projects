import { ApiObject, Chart, ChartProps } from 'cdk8s'
import { Construct } from 'constructs'
import * as certmanager from '@/imports/cert-manager.io'

export interface SystemChartProps extends ChartProps {
	readonly environment: 'staging' | 'prod'
}

export class SystemChart extends Chart {
	constructor(scope: Construct, id: string, props: SystemChartProps) {
		super(scope, id, props)

		const { environment } = props

		// Gateway Class
		new ApiObject(this, 'traefik-gateway-class', {
			apiVersion: 'gateway.networking.k8s.io/v1',
			kind: 'GatewayClass',
			metadata: {
				name: 'traefik',
				namespace: 'networking',
			},
			spec: {
				controllerName: 'traefik.io/gateway-controller',
			},
		})

		// Gateway
		const hostname =
			environment === 'staging' ? 'staging.imdbgraph.org' : 'imdbgraph.org'

		new ApiObject(this, 'traefik-gateway', {
			apiVersion: 'gateway.networking.k8s.io/v1',
			kind: 'Gateway',
			metadata: {
				name: 'traefik-gateway',
				namespace: 'networking',
			},
			spec: {
				gatewayClassName: 'traefik',
				listeners: [
					{
						name: 'web',
						port: 8000,
						protocol: 'HTTP',
						allowedRoutes: {
							namespaces: {
								from: 'All',
							},
						},
					},
					{
						name: 'websecure',
						port: 8443,
						protocol: 'HTTPS',
						hostname,
						tls: {
							mode: 'Terminate',
							certificateRefs: [
								{
									kind: 'Secret',
									name: 'imdbgraph-org-tls',
									namespace: 'networking',
								},
							],
						},
						allowedRoutes: {
							namespaces: {
								from: 'All',
							},
						},
					},
				],
			},
		})

		// Let's Encrypt Issuer
		const acmeServer =
			environment === 'staging'
				? 'https://acme-staging-v02.api.letsencrypt.org/directory'
				: 'https://acme-v02.api.letsencrypt.org/directory'

		new certmanager.Issuer(this, 'letsencrypt-issuer', {
			metadata: {
				name: 'letsencrypt',
				namespace: 'networking',
			},
			spec: {
				acme: {
					server: acmeServer,
					privateKeySecretRef: {
						name: 'acme-issuer-account-key',
					},
					solvers: [
						{
							http01: {
								gatewayHttpRoute: {
									parentRefs: [
										{
											name: 'traefik-gateway',
											namespace: 'networking',
											kind: 'Gateway',
										},
									],
								},
							},
						},
					],
				},
			},
		})

		// Certificate
		const dnsNames =
			environment === 'staging' ? ['staging.imdbgraph.org'] : ['imdbgraph.org']

		new certmanager.Certificate(this, 'imdbgraph-cert', {
			metadata: {
				name: 'imdbgraph-org',
				namespace: 'networking',
			},
			spec: {
				secretName: 'imdbgraph-org-tls',
				dnsNames,
				privateKey: {
					rotationPolicy:
						certmanager.CertificateSpecPrivateKeyRotationPolicy.ALWAYS,
				},
				issuerRef: {
					name: 'letsencrypt',
					kind: 'Issuer',
					group: 'cert-manager.io',
				},
			},
		})
	}
}
