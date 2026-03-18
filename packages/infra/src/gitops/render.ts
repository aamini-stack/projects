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
	deployRevision?: string
}): {
	chartSource: string
	applications: string
	stableApps: string
	imageAutomation: string
	previews: string
} {
	const stableApps = buildStableAppsManifest(input.apps, input.deployRevision)
	const previews = buildPreviewManifest(input.apps)

	return {
		chartSource: buildAppReleaseChartSourceManifest(),
		applications: [
			buildAppReleaseChartSourceManifest(),
			stableApps,
			previews,
			...input.appManifests,
		].join('\n---\n'),
		stableApps,
		imageAutomation: '',
		previews,
	}
}

export function loadAppDefinitions(appsDir: string): AppDefinition[] {
	return readdirSync(appsDir)
		.filter((file) => file.endsWith('.yaml'))
		.sort()
		.map(
			(file) =>
				parse(readFileSync(path.join(appsDir, file), 'utf8')) as AppDefinition,
		)
}

export function renderGitopsBundle(input: {
	sourceRoot: string
	outputRoot: string
	appManifestRoot?: string
	deployRevision?: string
	prNumber?: string
	appFilter?: string[] // Filter to only render specific apps
}): void {
	const appsSource = path.join(input.sourceRoot, 'apps')
	const apps = loadAppDefinitions(appsSource)
	const appManifests = loadAppManifestDocuments(
		input.appManifestRoot ?? input.sourceRoot,
		apps,
	)
	const bootstrapOutput = path.join(input.outputRoot, 'bootstrap')
	const platformCrdsOutput = path.join(input.outputRoot, 'platform-crds')
	const platformControllersOutput = path.join(
		input.outputRoot,
		'platform-controllers',
	)
	const platformConfigOutput = path.join(input.outputRoot, 'platform-config')
	const appsOutput = path.join(input.outputRoot, 'apps')
	const renderedApps = buildRenderedAppManifestsWithExtras({
		apps,
		appManifests,
		...(input.deployRevision ? { deployRevision: input.deployRevision } : {}),
	})

	rmSync(input.outputRoot, { force: true, recursive: true })
	mkdirSync(bootstrapOutput, { recursive: true })
	mkdirSync(platformCrdsOutput, { recursive: true })
	mkdirSync(platformControllersOutput, { recursive: true })
	mkdirSync(platformConfigOutput, { recursive: true })
	mkdirSync(appsOutput, { recursive: true })
	writeFileSync(
		path.join(platformCrdsOutput, 'kustomization.yaml'),
		buildKustomizationManifest([
			'https://github.com/kubernetes-sigs/gateway-api/config/crd?ref=v1.3.0',
		]),
	)
	copyFileSyncInto(
		path.join(input.sourceRoot, 'platform', 'controllers.yaml'),
		path.join(platformControllersOutput, 'controllers.yaml'),
	)
	writeFileSync(
		path.join(platformControllersOutput, 'kustomization.yaml'),
		buildKustomizationManifest(['controllers.yaml']),
	)
	const platformConfigResources = copyPlatformConfigManifests(
		path.join(input.sourceRoot, 'platform'),
		platformConfigOutput,
	)
	writeFileSync(
		path.join(platformConfigOutput, 'kustomization.yaml'),
		buildKustomizationManifest(platformConfigResources),
	)

	writeFileSync(
		path.join(bootstrapOutput, 'sync.yaml'),
		buildBootstrapSyncManifest(),
	)
	writeFileSync(
		path.join(appsOutput, 'kustomization.yaml'),
		buildKustomizationManifest(['applications.yaml']),
	)
	writeFileSync(
		path.join(appsOutput, 'applications.yaml'),
		renderedApps.applications,
	)
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

function copyFileSyncInto(source: string, destination: string): void {
	writeFileSync(destination, readFileSync(source, 'utf8'))
}

function copyPlatformConfigManifests(
	sourceRoot: string,
	outputRoot: string,
): string[] {
	return readdirSync(sourceRoot)
		.filter((file) => file.endsWith('.yaml') && file !== 'controllers.yaml')
		.sort()
		.map((file) => {
			copyFileSyncInto(path.join(sourceRoot, file), path.join(outputRoot, file))
			return file
		})
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

function buildStableAppsManifest(
	apps: AppDefinition[],
	deployRevision?: string,
): string {
	return apps
		.map((app) =>
			[
				'apiVersion: helm.toolkit.fluxcd.io/v2',
				'kind: HelmRelease',
				'metadata:',
				`  name: ${app.name}`,
				'  namespace: flux-system',
				'  labels:',
				'    aamini.dev/deploy-ready: enabled',
				'  annotations:',
				`    aamini.dev/image-policy: flux-system:${app.image.policy}`,
				`    event.toolkit.fluxcd.io/app: ${app.name}`,
				'    event.toolkit.fluxcd.io/environment: stable',
				`    event.toolkit.fluxcd.io/url: https://${app.stable.host}`,
				`    event.toolkit.fluxcd.io/deployment_environment: stable/${app.name}`,
				`    event.toolkit.fluxcd.io/commit: ${quoteYamlString(deployRevision)}`,
				`    event.toolkit.fluxcd.io/image_tag: ${quoteYamlString(deployRevision ? `main-${deployRevision}` : '')}`,
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
				`    deployRevision: ${quoteYamlString(deployRevision)}`,
				'    image:',
				`      repository: ${app.image.repository}`,
				'      tag: latest',
				'      pullPolicy: Always',
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
		'  url: oci://302481198387.dkr.ecr.us-east-1.amazonaws.com/app-release',
		'  provider: aws',
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

function buildPreviewManifest(apps: AppDefinition[]): string {
	return apps
		.filter((app) => app.preview.enabled)
		.flatMap((app) => [
			// TODO: Reconcile orphan preview resources when a PR disappears or its image tags are gone.
			// pr-134 left HTTPRoutes pointing at missing services, so the preview lifecycle needs a stale-state cleanup path.
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
			'        labels:',
			'          aamini.dev/deploy-ready: enabled',
			'        annotations:',
			`          event.toolkit.fluxcd.io/app: ${app.name}`,
			'          event.toolkit.fluxcd.io/environment: preview',
			'          event.toolkit.fluxcd.io/change_request: << inputs.id | quote >>',
			'          event.toolkit.fluxcd.io/commit: << inputs.sha | quote >>',
			'          event.toolkit.fluxcd.io/url: "https://${app.name}-pr-<< inputs.id >>.ariaamini.com"',
			`          event.toolkit.fluxcd.io/deployment_environment: "preview/pr-<< inputs.id >>/${app.name}"`,
			'          event.toolkit.fluxcd.io/image_tag: "pr-<< inputs.id >>"',
			`          event.toolkit.fluxcd.io/preview-url: "https://${app.name}-pr-<< inputs.id >>.ariaamini.com"`,
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
			'          deployRevision: << inputs.sha | quote >>',
			'          image:',
			`            repository: ${app.image.repository}`,
			'            tag: pr-<< inputs.id >>',
			'            pullPolicy: Always',
			`          host: ${app.name}-pr-<< inputs.id >>.ariaamini.com`,
			...(app.stable.envFromSecret
				? [`          envFromSecret: ${app.stable.envFromSecret}`]
				: []),
			'---',
		])
		.join('\n')
}
