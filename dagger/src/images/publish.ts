export type AppImagePublishTarget = {
	app: string
	buildArgs: { name: string; value: string }[]
	references: string[]
}

export function buildAppImagePublishPlan(input: {
	contextPath?: string
	dockerfile: string
	registry: string
	apps: string[]
	tags: string[]
}): {
	contextPath: string
	dockerfile: string
	publishes: AppImagePublishTarget[]
} {
	if (!input.dockerfile) {
		throw new Error('dockerfile is required to publish app images')
	}

	if (!input.registry) {
		throw new Error('registry is required to publish app images')
	}

	if (input.apps.length === 0) {
		throw new Error('at least one app is required to publish app images')
	}

	if (input.tags.length === 0) {
		throw new Error('at least one tag is required to publish app images')
	}

	return {
		contextPath: input.contextPath ?? '.',
		dockerfile: input.dockerfile,
		publishes: input.apps.map((app) => ({
			app,
			buildArgs: [{ name: 'APP_NAME', value: app }],
			references: input.tags.map((tag) => `${input.registry}/${app}:${tag}`),
		})),
	}
}
