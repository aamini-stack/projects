import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { loadAppDefinitions } from './app-definition.ts'
import {
	buildBootstrapSyncManifest,
	buildKustomizationManifest,
	buildRenderedAppManifestsWithExtras,
} from './builders.ts'
import { discoverAppManifestDocuments } from './discover-manifests.ts'

function copyFileSyncInto(source: string, destination: string): void {
	writeFileSync(destination, readFileSync(source, 'utf8'))
}

export function renderGitopsBundle(input: {
	sourceRoot: string
	outputRoot: string
	appManifestRoot?: string
}): void {
	const appsSource = path.join(input.sourceRoot, 'apps')
	const apps = loadAppDefinitions(appsSource)
	const appManifests = discoverAppManifestDocuments(
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
	copyFileSyncInto(
		path.join(input.sourceRoot, 'platform', 'networking.yaml'),
		path.join(platformConfigOutput, 'networking.yaml'),
	)
	copyFileSyncInto(
		path.join(input.sourceRoot, 'platform', 'previews.yaml'),
		path.join(platformConfigOutput, 'previews.yaml'),
	)
	writeFileSync(
		path.join(platformConfigOutput, 'kustomization.yaml'),
		buildKustomizationManifest(['networking.yaml', 'previews.yaml']),
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
