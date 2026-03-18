import { $ } from 'zx'
import { assertAppExists, listAppDirectories } from './repo.ts'

function getImageRefs(appName: string): string[] {
	const registry = process.env.ECR_REGISTRY ?? 'docker.io/aamini'
	const imageTag = process.env.IMAGE_TAG ?? 'latest'
	const includeLatest = process.env.DOCKER_PUSH_LATEST !== 'false'
	const refs = [`${registry}/${appName}:${imageTag}`]

	if (includeLatest && imageTag !== 'latest') {
		refs.push(`${registry}/${appName}:latest`)
	}

	return refs
}

async function buildImage(repoRoot: string, appName: string): Promise<void> {
	assertAppExists(repoRoot, appName)

	const refs = getImageRefs(appName)
	const dockerPlatform =
		process.env.DOCKER_PLATFORM ??
		(process.env.CI === 'true' ? 'linux/amd64' : '')

	const buildArgs = [
		'build',
		...(dockerPlatform ? ['--platform', dockerPlatform] : []),
		'--build-arg',
		`APP_NAME=${appName}`,
		'--build-arg',
		`PORT=${process.env.PORT ?? '3000'}`,
		'--build-arg',
		`NODE_VERSION=${process.env.NODE_VERSION ?? '22'}`,
		'--target',
		'production',
		...refs.flatMap((ref) => ['-t', ref]),
		'.',
	]

	console.log(`\nBuilding ${refs.join(', ')}\n`)
	await $({
		cwd: repoRoot,
		env: {
			...process.env,
			DOCKER_BUILDKIT: process.env.DOCKER_BUILDKIT ?? '1',
		},
	})`docker ${buildArgs}`
	console.log(`\nBuilt ${refs.join(', ')}\n`)
}

async function pushImage(repoRoot: string, appName: string): Promise<void> {
	assertAppExists(repoRoot, appName)

	for (const ref of getImageRefs(appName)) {
		console.log(`\nPushing ${ref}\n`)
		await $({ cwd: repoRoot })`docker push ${ref}`
	}
}

function parseApps(repoRoot: string, args: string[]): string[] {
	const runAll = args.includes('--all')
	const positionalArgs = args.filter((arg) => arg !== '--all')

	if (runAll) {
		return listAppDirectories(repoRoot)
	}

	const appName = positionalArgs[0]
	if (!appName) {
		throw new Error(
			'Usage: aamini docker build <app-name> | aamini docker build --all',
		)
	}

	return [appName]
}

export { buildImage, getImageRefs, parseApps, pushImage }
