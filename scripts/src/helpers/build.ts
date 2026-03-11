import { $ } from 'zx'
import { assertAppExists, listAppDirectories } from './repo.ts'

async function buildDockerImage(
	repoRoot: string,
	appName: string,
): Promise<void> {
	assertAppExists(repoRoot, appName)

	const image = `docker.io/aamini/${appName}:latest`
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
		'-t',
		image,
		'.',
	]

	console.log(`\nBuilding ${image}\n`)
	await $({ cwd: repoRoot })`docker ${buildArgs}`
	await $`docker push ${image}`
	console.log(`\nBuilt ${image}\n`)
}

async function runBuild(repoRoot: string, args: string[]): Promise<void> {
	const runAll = args.includes('--all')
	const positionalArgs = args.filter((arg) => arg !== '--all')

	if (runAll) {
		for (const app of listAppDirectories(repoRoot)) {
			await buildDockerImage(repoRoot, app)
		}
		return
	}

	const appName = positionalArgs[0]
	if (!appName) {
		throw new Error('Usage: aamini build <app-name> | aamini build --all')
	}

	await buildDockerImage(repoRoot, appName)
}

export { buildDockerImage, runBuild }
