import { Chart, ChartProps } from 'cdk8s'
import { Construct } from 'constructs'
import * as kustomize from '@/imports/kustomize.toolkit.fluxcd.io'

export interface GitOpsChartProps extends ChartProps {
	readonly environment: 'staging' | 'prod'
}

export class GitOpsChart extends Chart {
	constructor(scope: Construct, id: string, props: GitOpsChartProps) {
		super(scope, id, props)

		const { environment } = props

		// Helm packages Kustomization
		new kustomize.Kustomization(this, 'helm-kustomization', {
			metadata: {
				name: 'helm',
				namespace: 'flux-system',
			},
			spec: {
				path: './packages/infra/manifests/packages',
				sourceRef: {
					kind: kustomize.KustomizationSpecSourceRefKind.GIT_REPOSITORY,
					name: 'flux-system',
				},
				interval: '1h0m0s',
				retryInterval: '1m0s',
				timeout: '5m0s',
				prune: true,
			},
		})

		// System components Kustomization
		new kustomize.Kustomization(this, 'system-kustomization', {
			metadata: {
				name: 'system',
				namespace: 'flux-system',
			},
			spec: {
				path: `./packages/infra/manifests/system/${environment}`,
				dependsOn: [
					{
						name: 'helm',
					},
				],
				sourceRef: {
					kind: kustomize.KustomizationSpecSourceRefKind.GIT_REPOSITORY,
					name: 'flux-system',
				},
				interval: '1h0m0s',
				retryInterval: '1m0s',
				timeout: '5m0s',
				prune: true,
			},
		})

		// App Kustomization (imdbgraph)
		new kustomize.Kustomization(this, 'imdbgraph-kustomization', {
			metadata: {
				name: 'imdbgraph',
				namespace: 'flux-system',
			},
			spec: {
				path: `./apps/imdbgraph/manifests/${environment === 'staging' ? 'prod' : 'prod'}`, // Note: both point to prod in original
				dependsOn: [
					{
						name: 'system',
					},
				],
				sourceRef: {
					kind: kustomize.KustomizationSpecSourceRefKind.GIT_REPOSITORY,
					name: 'flux-system',
				},
				interval: '10m0s',
				retryInterval: '1m0s',
				timeout: '5m0s',
				prune: true,
			},
		})
	}
}
