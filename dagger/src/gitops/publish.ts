export function resolveGitopsSourceMetadata(input: {
	tags: string[]
	githubServerUrl?: string
	githubRepository?: string
	githubRefName?: string
	githubSha?: string
}): {
	source: string
	revision: string
} {
	if (
		input.githubServerUrl &&
		input.githubRepository &&
		input.githubRefName &&
		input.githubSha
	) {
		return {
			source: `${input.githubServerUrl}/${input.githubRepository}.git`,
			revision: `${input.githubRefName}@sha1:${input.githubSha}`,
		}
	}

	const mainTag = input.tags.find((tag) => tag.startsWith('main-'))
	const sha = mainTag?.slice('main-'.length) || 'local'

	return {
		source: 'git@github.com:aamini-stack/projects.git',
		revision: `main@sha1:${sha}`,
	}
}

export function buildGitopsPublishPlan(input: {
	registry: string
	tags: string[]
	sourcePath: string
	source: string
	revision: string
}): {
	references: string[]
	sourcePath: string
	source: string
	revision: string
} {
	if (!input.registry) {
		throw new Error('registry is required to publish gitops state')
	}

	const registry = input.registry.startsWith('oci://')
		? input.registry
		: `oci://${input.registry}`

	return {
		references: input.tags.map((tag) => `${registry}:${tag}`),
		sourcePath: input.sourcePath,
		source: input.source,
		revision: input.revision,
	}
}

export function buildGitopsPushArgs(input: {
	reference: string
	sourcePath: string
	source: string
	revision: string
	creds: string
}): string[] {
	return [
		'push',
		'artifact',
		input.reference,
		`--path=${input.sourcePath}`,
		`--source=${input.source}`,
		`--revision=${input.revision}`,
		`--creds=${input.creds}`,
	]
}
