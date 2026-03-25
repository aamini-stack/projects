import type { AppDefinition } from './app-definition.ts'

export function buildBootstrapSyncManifest(): string {
	return [
		buildFluxKustomization({
			name: 'platform-crds',
			path: './platform-crds',
			interval: '10m0s',
		}),
		'---',
		buildFluxKustomization({
			name: 'platform-controllers',
			path: './platform-controllers',
			interval: '10m0s',
			dependsOn: 'platform-crds',
		}),
		'---',
		buildFluxKustomization({
			name: 'platform-config',
			path: './platform-config',
			interval: '10m0s',
			dependsOn: 'platform-controllers',
			substituteSecret: 'networking-secrets',
		}),
		'---',
		buildFluxKustomization({
			name: 'apps',
			path: './apps',
			interval: '10m0s',
			dependsOn: 'platform-config',
		}),
	].join('\n')
}

export function buildRenderedAppManifestsWithExtras(input: {
	apps: AppDefinition[]
	appManifests: string[]
}): {
	chartSource: string
	applications: string
	stableApps: string
	imageAutomation: string
	previews: string
} {
	const stableApps = buildStableAppsManifest(input.apps)
	const imageAutomation = buildImageAutomationManifest(input.apps)
	const previews = buildPreviewManifest(input.apps)

	return {
		chartSource: buildAppReleaseChartSourceManifest(),
		applications: [
			buildAppReleaseChartSourceManifest(),
			stableApps,
			imageAutomation,
			previews,
			...input.appManifests,
		].join('\n---\n'),
		stableApps,
		imageAutomation,
		previews,
	}
}

export function buildKustomizationManifest(resources: string[]): string {
	return [
		'apiVersion: kustomize.config.k8s.io/v1beta1',
		'kind: Kustomization',
		'resources:',
		...resources.map((resource) => `  - ${resource}`),
	].join('\n')
}

function buildFluxKustomization(input: {
	name: string
	path: string
	interval: string
	dependsOn?: string
	substituteSecret?: string
}): string {
	return [
		'apiVersion: kustomize.toolkit.fluxcd.io/v1',
		'kind: Kustomization',
		'metadata:',
		`  name: ${input.name}`,
		'  namespace: flux-system',
		'spec:',
		`  path: ${input.path}`,
		...(input.dependsOn
			? ['  dependsOn:', `    - name: ${input.dependsOn}`]
			: []),
		'  sourceRef:',
		'    kind: OCIRepository',
		'    name: flux-system',
		`  interval: ${input.interval}`,
		'  retryInterval: 1m0s',
		'  timeout: 5m0s',
		'  prune: true',
		...(input.substituteSecret
			? [
					'  postBuild:',
					'    substituteFrom:',
					'      - kind: Secret',
					`        name: ${input.substituteSecret}`,
				]
			: []),
	].join('\n')
}

function buildStableAppsManifest(apps: AppDefinition[]): string {
	return apps
		.map((app) =>
			[
				'apiVersion: helm.toolkit.fluxcd.io/v2',
				'kind: HelmRelease',
				'metadata:',
				`  name: ${app.name}`,
				'  namespace: flux-system',
				'  annotations:',
				`    aamini.dev/image-policy: flux-system:${app.image.policy}`,
				'spec:',
				`  releaseName: ${app.name}`,
				`  targetNamespace: ${app.namespace}`,
				'  interval: 10m',
				'  install:',
				'    createNamespace: true',
				'  chartRef:',
				'    kind: OCIRepository',
				'    name: app-release',
				'    namespace: flux-system',
				'  values:',
				'    app:',
				`      name: ${app.name}`,
				`      namespace: ${app.namespace}`,
				'    image:',
				`      repository: ${app.image.repository}`,
				'      tag: latest',
				`    host: ${app.stable.host}`,
				`    rootHost: ${quoteYamlString(app.stable.rootHost)}`,
				`    envFromSecret: ${quoteYamlString(app.stable.envFromSecret)}`,
			].join('\n'),
		)
		.join('\n---\n')
}

function buildAppReleaseChartSourceManifest(): string {
	return [
		'apiVersion: source.toolkit.fluxcd.io/v1',
		'kind: OCIRepository',
		'metadata:',
		'  name: app-release',
		'  namespace: flux-system',
		'spec:',
		'  interval: 10m',
		'  url: oci://ghcr.io/aamini-stack/app-release',
		'  secretRef:',
		'    name: ghcr-auth',
		'  layerSelector:',
		'    mediaType: application/vnd.cncf.helm.chart.content.v1.tar+gzip',
		'    operation: copy',
		'  ref:',
		'    tag: 0.1.0',
	].join('\n')
}

function quoteYamlString(value?: string): string {
	if (!value) {
		return "''"
	}

	return value
}

function buildImageAutomationManifest(apps: AppDefinition[]): string {
	return apps
		.flatMap((app) => [
			'apiVersion: image.toolkit.fluxcd.io/v1beta2',
			'kind: ImageRepository',
			'metadata:',
			`  name: ${app.name}`,
			'  namespace: flux-system',
			'spec:',
			`  image: ${app.image.repository}`,
			'  interval: 5m',
			'  secretRef:',
			'    name: ghcr-auth',
			'---',
			'apiVersion: image.toolkit.fluxcd.io/v1beta2',
			'kind: ImagePolicy',
			'metadata:',
			`  name: ${app.image.policy}`,
			'  namespace: flux-system',
			'spec:',
			'  imageRepositoryRef:',
			`    name: ${app.name}`,
			'  filterTags:',
			"    pattern: '^main-[a-f0-9]+$'",
			'  policy:',
			'    alphabetical:',
			'      order: asc',
			'---',
		])
		.join('\n')
}

function buildPreviewManifest(apps: AppDefinition[]): string {
	return apps
		.filter((app) => app.preview.enabled)
		.flatMap((app) => [
			'apiVersion: fluxcd.controlplane.io/v1',
			'kind: ResourceSet',
			'metadata:',
			`  name: ${app.name}-pr-previews`,
			'  namespace: flux-system',
			'spec:',
			'  serviceAccountName: flux',
			'  inputsFrom:',
			'    - apiVersion: fluxcd.controlplane.io/v1',
			'      kind: ResourceSetInputProvider',
			'      name: repo-pull-requests',
			'  resources:',
			'    - apiVersion: helm.toolkit.fluxcd.io/v2',
			'      kind: HelmRelease',
			'      metadata:',
			`        name: ${app.name}-pr-<< inputs.id >>`,
			'        namespace: app-preview',
			'        annotations:',
			'          event.toolkit.fluxcd.io/change_request: << inputs.id | quote >>',
			'          event.toolkit.fluxcd.io/commit: << inputs.sha | quote >>',
			`          event.toolkit.fluxcd.io/preview-url: "https://${app.name}-pr-<< inputs.id >>.preview.ariaamini.com"`,
			'      spec:',
			`        releaseName: ${app.name}-pr-<< inputs.id >>`,
			'        interval: 10m',
			'        chartRef:',
			'          kind: OCIRepository',
			'          name: app-release',
			'          namespace: flux-system',
			'        values:',
			'          app:',
			`            name: ${app.name}-pr-<< inputs.id >>`,
			'            namespace: app-preview',
			'          image:',
			`            repository: ${app.image.repository}`,
			'            tag: pr-<< inputs.id >>',
			`          host: ${app.name}-pr-<< inputs.id >>.preview.ariaamini.com`,
			...(app.stable.envFromSecret
				? [`          envFromSecret: ${app.stable.envFromSecret}`]
				: []),
			'---',
		])
		.join('\n')
}
