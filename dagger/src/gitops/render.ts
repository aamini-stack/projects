import {
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'

export interface AppDefinition {
	name: string
	namespace: string
	image: {
		repository: string
		policy: string
	}
	stable: {
		host: string
		rootHost?: string
		envFromSecret?: string
	}
	preview: {
		enabled: boolean
	}
}

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

export function buildRenderedAppManifests(apps: AppDefinition[]): {
	chartSource: string
	applications: string
	stableApps: string
	imageAutomation: string
	previews: string
} {
	return buildRenderedAppManifestsWithExtras({
		apps,
		appManifests: [],
	})
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

export function loadAppDefinitions(appsDir: string): AppDefinition[] {
	return loadAppDefinitionsFromContents(
		readdirSync(appsDir)
			.filter((file) => file.endsWith('.yaml'))
			.sort()
			.map((file) => readFileSync(path.join(appsDir, file), 'utf8')),
	)
}

export function loadAppDefinitionsFromContents(
	contents: string[],
): AppDefinition[] {
	return contents.map((content) => parse(content) as AppDefinition)
}

export function buildGitopsBundleFiles(input: {
	controllers: string
	networking: string
	previews: string
	apps: AppDefinition[]
	appManifests?: string[]
}): Record<string, string> {
	const appManifests = input.appManifests ?? []
	const renderedApps = buildRenderedAppManifestsWithExtras({
		apps: input.apps,
		appManifests,
	})

	return {
		'bootstrap/sync.yaml': buildBootstrapSyncManifest(),
		'platform-crds/kustomization.yaml': buildKustomizationManifest([
			'https://github.com/kubernetes-sigs/gateway-api/config/crd?ref=v1.3.0',
		]),
		'platform-controllers/controllers.yaml': input.controllers,
		'platform-controllers/kustomization.yaml': buildKustomizationManifest([
			'controllers.yaml',
		]),
		'platform-config/networking.yaml': input.networking,
		'platform-config/previews.yaml': input.previews,
		'platform-config/kustomization.yaml': buildKustomizationManifest([
			'networking.yaml',
			'previews.yaml',
		]),
		'apps/kustomization.yaml': buildKustomizationManifest([
			'applications.yaml',
		]),
		'apps/applications.yaml': [
			renderedApps.chartSource,
			renderedApps.stableApps,
			renderedApps.imageAutomation,
			renderedApps.previews,
			...appManifests,
		].join('\n---\n'),
	}
}

export function renderGitopsBundle(input: {
	sourceRoot: string
	outputRoot: string
	appManifestRoot?: string
}): void {
	const appsSource = path.join(input.sourceRoot, 'apps')
	const apps = loadAppDefinitions(appsSource)
	const files = buildGitopsBundleFiles({
		controllers: readFileSync(
			path.join(input.sourceRoot, 'platform', 'controllers.yaml'),
			'utf8',
		),
		networking: readFileSync(
			path.join(input.sourceRoot, 'platform', 'networking.yaml'),
			'utf8',
		),
		previews: readFileSync(
			path.join(input.sourceRoot, 'platform', 'previews.yaml'),
			'utf8',
		),
		apps,
		appManifests: loadAppManifestDocuments(
			input.appManifestRoot ?? input.sourceRoot,
			apps,
		),
	})

	rmSync(input.outputRoot, { force: true, recursive: true })
	for (const [relativePath, contents] of Object.entries(files)) {
		const absolutePath = path.join(input.outputRoot, relativePath)
		mkdirSync(path.dirname(absolutePath), { recursive: true })
		writeFileSync(absolutePath, contents)
	}
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

function loadAppManifestDocuments(
	appManifestRoot: string,
	apps: AppDefinition[],
): string[] {
	return apps.flatMap((app) => {
		const manifestDir = path.join(appManifestRoot, 'apps', app.name, 'k8s')
		try {
			return readdirSync(manifestDir)
				.filter((file) => file.endsWith('.yaml'))
				.sort()
				.map((file) =>
					readFileSync(path.join(manifestDir, file), 'utf8').trim(),
				)
				.filter(Boolean)
		} catch {
			return []
		}
	})
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

function buildKustomizationManifest(resources: string[]): string {
	return [
		'apiVersion: kustomize.config.k8s.io/v1beta1',
		'kind: Kustomization',
		'resources:',
		...resources.map((resource) => `  - ${resource}`),
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
