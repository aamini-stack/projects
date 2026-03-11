export function buildChartPublishPlan(input: {
	chartPath: string
	registry: string
	version: string
	githubActor: string
}): {
	chartArchive: string
	chartPath: string
	loginArgs: string[]
	mountPath: string
	packageArgs: string[]
	pushRef: string
	pushArgs: string[]
	registryHost: string
	verifyArgs: string[]
} {
	if (!input.chartPath) {
		throw new Error('chartPath is required to publish app release chart')
	}

	if (!input.registry) {
		throw new Error('registry is required to publish app release chart')
	}

	if (!input.version) {
		throw new Error('version is required to publish app release chart')
	}

	if (!input.githubActor) {
		throw new Error('githubActor is required to publish app release chart')
	}

	const pushRef = input.registry.startsWith('oci://')
		? input.registry
		: `oci://${input.registry}`
	const registryHost = input.registry.replace(/^oci:\/\//, '').split('/')[0]

	return {
		chartArchive: `/tmp/app-release-${input.version}.tgz`,
		chartPath: input.chartPath,
		loginArgs: [
			'registry',
			'login',
			registryHost,
			'--username',
			input.githubActor,
			'--password',
			'$HELM_REGISTRY_PASSWORD',
		],
		mountPath: '/chart',
		packageArgs: [
			'package',
			'/chart',
			'--destination',
			'/tmp',
			'--version',
			input.version,
		],
		pushRef,
		pushArgs: ['push', `/tmp/app-release-${input.version}.tgz`, pushRef],
		registryHost,
		verifyArgs: ['show', 'chart', pushRef, '--version', input.version],
	}
}
