export type PublishGitopsStateInput = {
	registry: string
	tags: string[]
	githubActor: string
}

export type PublishAppReleaseChartInput = {
	registry: string
	githubActor: string
}

export type PublishAppImagesInput = {
	registry: string
	apps: string[]
	tags: string[]
	githubActor: string
}

export type PublishMainAppImagesInput = {
	registry: string
	app: string
	sha: string
	githubActor: string
}

export type PublishPrAppImagesInput = {
	registry: string
	app: string
	prNumber: number
	githubActor: string
}

export type CiMode = 'artifacts' | 'preview' | 'release-state'

export type CiEvent = 'pr' | 'main'

export type CiRunInput = {
	mode: CiMode
	event: CiEvent
	sha: string
	prNumber?: number
	githubActor: string
	registry: string
	apps: string[]
}

export function validateCiRunInput(
	input: Pick<CiRunInput, 'mode' | 'event' | 'sha' | 'prNumber'>,
): void {
	if (!['pr', 'main'].includes(input.event)) {
		throw new Error(`Invalid ci event: ${input.event}`)
	}

	if (input.mode === 'preview' && input.event !== 'pr') {
		throw new Error('preview mode is only supported for pr events')
	}

	if (input.mode === 'release-state' && input.event !== 'main') {
		throw new Error('release-state mode is only supported for main events')
	}

	if (input.event === 'pr' && !input.prNumber) {
		throw new Error('CI run for PR event requires --pr-number')
	}
}

export function buildPublishGitopsStateArgs(
	input: PublishGitopsStateInput,
): string[] {
	return [
		'publish-gitops-state',
		`--registry=${input.registry}`,
		...input.tags.map((tag) => `--tags=${tag}`),
		'--github-token=env://GITHUB_TOKEN',
		`--github-actor=${input.githubActor}`,
	]
}

export function buildPublishAppReleaseChartArgs(
	input: PublishAppReleaseChartInput,
): string[] {
	return [
		'publish-app-release-chart',
		`--registry=${input.registry}`,
		'--github-token=env://GITHUB_TOKEN',
		`--github-actor=${input.githubActor}`,
	]
}

export function buildPublishAppImagesArgs(
	input: PublishAppImagesInput,
): string[] {
	return [
		'publish-app-images',
		`--registry=${input.registry}`,
		...input.apps.map((app) => `--apps=${app}`),
		...input.tags.map((tag) => `--tags=${tag}`),
		'--github-token=env://GITHUB_TOKEN',
		`--github-actor=${input.githubActor}`,
	]
}

export function buildPublishMainAppImagesArgs(
	input: PublishMainAppImagesInput,
): string[] {
	return buildPublishAppImagesArgs({
		registry: input.registry,
		apps: [input.app],
		tags: ['latest', `main-${input.sha}`],
		githubActor: input.githubActor,
	})
}

export function buildPublishPrAppImagesArgs(
	input: PublishPrAppImagesInput,
): string[] {
	return buildPublishAppImagesArgs({
		registry: input.registry,
		apps: [input.app],
		tags: [`pr-${input.prNumber}`],
		githubActor: input.githubActor,
	})
}

export function derivePublishTags(input: {
	event: CiEvent
	sha: string
	prNumber?: number
}): string[] {
	if (input.event === 'main') {
		return ['latest', `main-${input.sha}`]
	}

	if (input.event === 'pr') {
		if (!input.prNumber) {
			throw new Error('CI run for PR event requires --pr-number')
		}
		return [`pr-${input.prNumber}`]
	}

	return []
}

export function buildCiRunArgs(input: CiRunInput): string[] {
	if (!['pr', 'main'].includes(input.event)) {
		throw new Error(`Invalid ci event: ${input.event}`)
	}

	if (input.mode === 'preview' && input.event !== 'pr') {
		throw new Error('preview mode is only supported for pr events')
	}

	if (input.mode === 'release-state' && input.event !== 'main') {
		throw new Error('release-state mode is only supported for main events')
	}

	const tags = derivePublishTags({
		event: input.event,
		sha: input.sha,
		prNumber: input.prNumber,
	})
	const command = [
		'ci-run',
		input.mode,
		`--event=${input.event}`,
		`--sha=${input.sha}`,
		`--github-actor=${input.githubActor}`,
		`--registry=${input.registry}`,
	]

	if (input.event === 'pr') {
		command.push(`--pr-number=${input.prNumber}`)
	}

	if (input.mode === 'artifacts') {
		if (input.apps.length === 0) {
			throw new Error('CI run for artifacts mode requires at least one app')
		}

		command.push(
			...buildPublishAppImagesArgs({
				registry: input.registry,
				apps: input.apps,
				tags,
				githubActor: input.githubActor,
			}),
		)
		return command
	}

	command.push(
		...buildPublishGitopsStateArgs({
			registry: input.registry,
			tags,
			githubActor: input.githubActor,
		}),
	)
	return command
}
