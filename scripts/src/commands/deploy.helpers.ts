import { pathToFileURL } from 'node:url'
import path from 'node:path'

export type DeployEnvironment = 'preview' | 'production'

type BuildManifestTagInput = {
	app: string
	sha: string
	prNumber?: string
}

export function buildManifestTag(input: BuildManifestTagInput): string {
	if (input.prNumber) {
		return `projects-gitops:${input.app}-manifests-pr-${input.prNumber}-${input.sha}`
	}

	return `projects-gitops:${input.app}-manifests-main-${input.sha}`
}

type BuildFluxPayloadInput = {
	app: string
	sha: string
	environment: DeployEnvironment
	prNumber?: string
}

export function buildFluxPayload(input: BuildFluxPayloadInput): {
	source: 'github-actions'
	workflow: 'deploy'
	run_id: string
	app: string
	sha: string
	environment: DeployEnvironment
	pr_number?: string
} {
	return {
		source: 'github-actions',
		workflow: 'deploy',
		run_id: process.env.GITHUB_RUN_ID ?? 'unknown',
		app: input.app,
		sha: input.sha,
		environment: input.environment,
		...(input.prNumber ? { pr_number: input.prNumber } : {}),
	}
}

export function buildRenderModuleSpecifier(repoRoot: string): string {
	const modulePath = path.join(
		repoRoot,
		'packages',
		'infra',
		'src',
		'gitops',
		'render.ts',
	)
	return pathToFileURL(modulePath).href
}

export function buildBundleArchivePath(): string {
	return '.tmp/projects-gitops.tar.gz'
}

export function extractManifestRepository(manifestTag: string): string {
	const [repository] = manifestTag.split(':', 1)
	if (!repository) {
		throw new Error(`Invalid manifest tag: ${manifestTag}`)
	}

	return repository
}

export function isFluxNotifySuccessStatus(status: number): boolean {
	return status >= 200 && status < 300
}
