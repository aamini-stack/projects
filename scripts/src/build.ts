import { $ } from 'zx'
import { assertAppExists, listAppDirectories } from './helpers/repo.ts'

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

async function buildDockerImage(
	repoRoot: string,
	appName: string,
): Promise<void> {
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

async function pushDockerImage(
	repoRoot: string,
	appName: string,
): Promise<void> {
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
			'Usage: aamini build|push <app-name> | aamini build|push --all',
		)
	}

	return [appName]
}

async function runBuild(repoRoot: string, args: string[]): Promise<void> {
	for (const appName of parseApps(repoRoot, args)) {
		await buildDockerImage(repoRoot, appName)
	}
}

async function runPush(repoRoot: string, args: string[]): Promise<void> {
	for (const appName of parseApps(repoRoot, args)) {
		await pushDockerImage(repoRoot, appName)
	}
}

export { buildDockerImage, pushDockerImage, runBuild, runPush }
