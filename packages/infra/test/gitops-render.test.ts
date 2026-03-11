import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { parse } from 'yaml'

import {
	buildBootstrapSyncManifest,
	buildRenderedAppManifests,
	loadAppDefinitions,
	renderGitopsBundle,
} from '../src/gitops/render'

const apps = [
	{
		name: 'portfolio',
		namespace: 'portfolio',
		image: {
			repository: 'ghcr.io/aamini-stack/portfolio',
			policy: 'portfolio',
		},
		stable: {
			host: 'portfolio.ariaamini.com',
			rootHost: 'ariaamini.com',
			envFromSecret: 'portfolio-secrets',
		},
		preview: {
			enabled: true,
		},
	},
	{
		name: 'pc-tune-ups',
		namespace: 'pc-tune-ups',
		image: {
			repository: 'ghcr.io/aamini-stack/pc-tune-ups',
			policy: 'pc-tune-ups',
		},
		stable: {
			host: 'pc-tune-ups.ariaamini.com',
		},
		preview: {
			enabled: false,
		},
	},
]
const testDir = __dirname

void test('buildBootstrapSyncManifest emits ordered flux stages for crds, controllers, config, and apps', () => {
	const manifest = buildBootstrapSyncManifest()

	assert.doesNotMatch(
		manifest,
		/apiVersion: source.toolkit.fluxcd.io\/v1\s*\nkind: OCIRepository\s*\nmetadata:\s*\n\s*name: flux-system/,
	)
	assert.match(manifest, /kind: Kustomization/)
	assert.match(manifest, /name: platform-crds/)
	assert.match(manifest, /name: platform-controllers/)
	assert.match(manifest, /name: platform-config/)
	assert.match(manifest, /name: apps/)
	assert.match(manifest, /path: \.\/platform-crds/)
	assert.match(manifest, /path: \.\/platform-controllers/)
	assert.match(manifest, /path: \.\/platform-config/)
	assert.match(manifest, /path: \.\/apps/)
	assert.match(
		manifest,
		/name: platform-controllers[\s\S]*dependsOn:\s*\n\s*- name: platform-crds/,
	)
	assert.match(
		manifest,
		/name: platform-config[\s\S]*dependsOn:\s*\n\s*- name: platform-controllers/,
	)
	assert.match(
		manifest,
		/name: apps[\s\S]*dependsOn:\s*\n\s*- name: platform-config/,
	)
})

void test('buildRenderedAppManifests renders stable, image automation, and preview resources from one catalog', () => {
	const rendered = buildRenderedAppManifests(apps)
	const chartSource = parse(rendered.chartSource) as {
		apiVersion: string
		kind: string
		metadata: {
			name: string
			namespace: string
		}
		spec: {
			interval: string
			url: string
			secretRef: {
				name: string
			}
			layerSelector: {
				mediaType: string
				operation: string
			}
			ref: {
				tag: string
			}
		}
	}

	assert.doesNotMatch(rendered.stableApps, /kind: StaticInputProvider/)
	assert.match(rendered.stableApps, /kind: HelmRelease/)
	assert.match(rendered.stableApps, /name: portfolio/)
	assert.match(rendered.stableApps, /name: pc-tune-ups/)
	assert.match(rendered.stableApps, /targetNamespace: portfolio/)
	assert.match(rendered.stableApps, /targetNamespace: pc-tune-ups/)
	assert.match(rendered.stableApps, /createNamespace: true/)
	assert.match(rendered.stableApps, /rootHost: ariaamini\.com/)
	assert.match(rendered.stableApps, /envFromSecret: portfolio-secrets/)
	assert.match(rendered.stableApps, /rootHost: ''/)
	assert.match(rendered.stableApps, /envFromSecret: ''/)

	assert.match(rendered.imageAutomation, /kind: ImageRepository/)
	assert.match(
		rendered.imageAutomation,
		/image: ghcr\.io\/aamini-stack\/portfolio/,
	)
	assert.match(rendered.imageAutomation, /kind: ImagePolicy/)
	assert.match(rendered.imageAutomation, /name: pc-tune-ups/)

	assert.match(rendered.previews, /name: portfolio-pr-previews/)
	assert.match(
		rendered.previews,
		/metadata:\s*\n\s*name: portfolio-pr-previews\s*\n\s*namespace: flux-system/,
	)
	assert.doesNotMatch(rendered.previews, /pc-tune-ups-pr-previews/)
	assert.match(
		rendered.previews,
		/inputsFrom:\s*\n\s*- apiVersion: fluxcd.controlplane.io\/v1\s*\n\s*kind: ResourceSetInputProvider\s*\n\s*name: repo-pull-requests/,
	)
	assert.doesNotMatch(rendered.previews, /inputs\.number/)
	assert.doesNotMatch(rendered.previews, /inputs\.headSHA/)
	assert.match(rendered.previews, /inputs\.id/)
	assert.match(rendered.previews, /inputs\.sha/)
	assert.match(
		rendered.stableApps,
		/chartRef:\s*\n\s*kind: OCIRepository\s*\n\s*name: app-release/,
	)
	assert.match(
		rendered.stableApps,
		/chartRef:\s*\n\s*kind: OCIRepository\s*\n\s*name: app-release\s*\n\s*namespace: flux-system/,
	)
	assert.match(
		rendered.previews,
		/chartRef:\s*\n\s*kind: OCIRepository\s*\n\s*name: app-release\s*\n\s*namespace: flux-system/,
	)
	assert.deepEqual(chartSource, {
		apiVersion: 'source.toolkit.fluxcd.io/v1',
		kind: 'OCIRepository',
		metadata: {
			name: 'app-release',
			namespace: 'flux-system',
		},
		spec: {
			interval: '10m',
			url: 'oci://ghcr.io/aamini-stack/app-release',
			secretRef: {
				name: 'ghcr-auth',
			},
			layerSelector: {
				mediaType: 'application/vnd.cncf.helm.chart.content.v1.tar+gzip',
				operation: 'copy',
			},
			ref: {
				tag: '0.1.0',
			},
		},
	})
	assert.doesNotMatch(rendered.applications, /spec:\s*\n[\s\S]*\n\s*type: oci/)
	assert.match(
		rendered.applications,
		/apiVersion: helm.toolkit.fluxcd.io\/v2[\s\S]*kind: HelmRelease[\s\S]*name: portfolio/,
	)
})

void test('loadAppDefinitions reads one yaml file per app and preserves optional fields', () => {
	const root = mkdtempSync(path.join(tmpdir(), 'gitops-app-defs-'))
	const appsDir = path.join(root, 'apps')

	mkdirSync(appsDir)
	writeFileSync(
		path.join(appsDir, 'portfolio.yaml'),
		[
			'name: portfolio',
			'namespace: portfolio',
			'image:',
			'  repository: ghcr.io/aamini-stack/portfolio',
			'  policy: portfolio',
			'stable:',
			'  host: portfolio.ariaamini.com',
			'  rootHost: ariaamini.com',
			'  envFromSecret: portfolio-secrets',
			'preview:',
			'  enabled: true',
			'',
		].join('\n'),
	)

	assert.deepEqual(loadAppDefinitions(appsDir), [apps[0]])
})

void test('renderGitopsBundle writes staged platform directories and app output', () => {
	const root = mkdtempSync(path.join(tmpdir(), 'gitops-render-'))
	const sourceRoot = path.join(root, 'source')
	const appManifestRoot = path.join(root, 'repo')
	const outputRoot = path.join(root, 'rendered')
	const appsDir = path.join(sourceRoot, 'apps')
	const appManifestDir = path.join(appManifestRoot, 'apps', 'portfolio', 'k8s')
	const platformDir = path.join(sourceRoot, 'platform')

	mkdirSync(appsDir, { recursive: true })
	mkdirSync(appManifestDir, { recursive: true })
	mkdirSync(platformDir, { recursive: true })
	writeFileSync(
		path.join(platformDir, 'controllers.yaml'),
		'kind: Namespace\nmetadata:\n  name: platform-controllers\n',
	)
	writeFileSync(
		path.join(platformDir, 'networking.yaml'),
		'kind: Namespace\nmetadata:\n  name: flux-system\n',
	)
	writeFileSync(
		path.join(platformDir, 'previews.yaml'),
		'kind: Namespace\nmetadata:\n  name: app-preview\n',
	)
	writeFileSync(
		path.join(appsDir, 'portfolio.yaml'),
		[
			'name: portfolio',
			'namespace: portfolio',
			'image:',
			'  repository: ghcr.io/aamini-stack/portfolio',
			'  policy: portfolio',
			'stable:',
			'  host: portfolio.ariaamini.com',
			'preview:',
			'  enabled: true',
			'',
		].join('\n'),
	)
	writeFileSync(
		path.join(appManifestDir, 'sealed-secret.yaml'),
		[
			'apiVersion: bitnami.com/v1alpha1',
			'kind: SealedSecret',
			'metadata:',
			'  name: secrets',
			'  namespace: portfolio',
			'spec:',
			'  encryptedData:',
			'    TOKEN: encrypted',
			'  template:',
			'    metadata:',
			'      name: portfolio-secrets',
			'      namespace: portfolio',
			'',
		].join('\n'),
	)

	renderGitopsBundle({
		sourceRoot,
		outputRoot,
		appManifestRoot,
	})

	assert.match(
		readFileSync(path.join(outputRoot, 'bootstrap', 'sync.yaml'), 'utf8'),
		/name: platform-crds/,
	)
	assert.match(
		readFileSync(path.join(outputRoot, 'bootstrap', 'sync.yaml'), 'utf8'),
		/name: platform-config/,
	)
	assert.match(
		readFileSync(path.join(outputRoot, 'apps', 'kustomization.yaml'), 'utf8'),
		/resources:\s*\n\s*- applications.yaml/,
	)
	assert.match(
		readFileSync(path.join(outputRoot, 'apps', 'applications.yaml'), 'utf8'),
		/name: portfolio/,
	)
	assert.match(
		readFileSync(path.join(outputRoot, 'apps', 'applications.yaml'), 'utf8'),
		/kind: SealedSecret[\s\S]*name: portfolio-secrets/,
	)
	assert.match(
		readFileSync(
			path.join(outputRoot, 'platform-controllers', 'controllers.yaml'),
			'utf8',
		),
		/name: platform-controllers/,
	)
	assert.match(
		readFileSync(
			path.join(outputRoot, 'platform-config', 'networking.yaml'),
			'utf8',
		),
		/name: flux-system/,
	)
	assert.match(
		readFileSync(
			path.join(outputRoot, 'platform-config', 'previews.yaml'),
			'utf8',
		),
		/name: app-preview/,
	)
	assert.match(
		readFileSync(
			path.join(outputRoot, 'platform-controllers', 'kustomization.yaml'),
			'utf8',
		),
		/resources:\s*\n\s*- controllers.yaml/,
	)
	assert.match(
		readFileSync(
			path.join(outputRoot, 'platform-config', 'kustomization.yaml'),
			'utf8',
		),
		/resources:\s*\n\s*- networking.yaml\s*\n\s*- previews.yaml/,
	)
	assert.match(
		readFileSync(
			path.join(outputRoot, 'platform-crds', 'kustomization.yaml'),
			'utf8',
		),
		/gateway-api/,
	)
})

void test('preview namespace RBAC grants app-preview access to the flux-system reconciler service account', () => {
	const previewsManifest = readFileSync(
		path.join(testDir, '..', 'manifests', 'platform', 'previews.yaml'),
		'utf8',
	)

	assert.match(
		previewsManifest,
		/subjects:\s*\n\s*- kind: ServiceAccount\s*\n\s*name: flux\s*\n\s*namespace: flux-system/,
	)
	assert.doesNotMatch(
		previewsManifest,
		/subjects:\s*\n\s*- kind: ServiceAccount\s*\n\s*name: flux\s*\n\s*namespace: app-preview/,
	)
})
