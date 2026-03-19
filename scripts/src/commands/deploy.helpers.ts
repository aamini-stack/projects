export type DeployEnvironment = 'preview' | 'production'

type BuildManifestTagInput = {
	app: string
	sha: string
	prNumber?: string
}

export function buildManifestTag(input: BuildManifestTagInput): string {
	if (input.prNumber) {
		return `${input.app}-manifests:pr-${input.prNumber}-${input.sha}`
	}

	return `${input.app}-manifests:main-${input.sha}`
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
