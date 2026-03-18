import { $ } from 'zx'
import * as path from 'node:path'
import { mkdirSync } from 'node:fs'
import { cac } from 'cac'
import {
	assertAppExists,
	getRepoRoot,
	listAppDirectories,
} from '../helpers/repo.ts'

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

async function runDeploy(
	repoRoot: string,
	deployRevision?: string,
): Promise<void> {
	const { renderGitopsBundle } = await import(
		// @ts-ignore - external package import
		'../../../../packages/infra/src/gitops/render.ts'
	)
	const sourceRoot = path.join(repoRoot, 'packages', 'infra', 'manifests')
	const outputRoot = path.join(repoRoot, '.tmp/gitops-bundle')

	mkdirSync(path.dirname(outputRoot), { recursive: true })
	renderGitopsBundle({
		sourceRoot,
		outputRoot,
		appManifestRoot: repoRoot,
		...(deployRevision ? { deployRevision } : {}),
	})
	console.log(outputRoot)
}

export function createDockerCommand(): ReturnType<typeof cac> {
	const cli = cac('aamini docker')
	cli.version('0.0.1')
	cli.help()

	cli.command('').action(() => {
		cli.outputHelp()
	})

	cli.command('build', 'Build Docker image').action(() => {
		const dockerBuildCli = createDockerBuildCommand()
		dockerBuildCli.parse(process.argv.slice(3))
	})

	cli.command('push', 'Push Docker image').action(() => {
		const dockerPushCli = createDockerPushCommand()
		dockerPushCli.parse(process.argv.slice(3))
	})

	cli.command('deploy', 'Deploy Docker container').action(() => {
		const dockerDeployCli = createDockerDeployCommand()
		dockerDeployCli.parse(process.argv.slice(3))
	})

	return cli
}

export function createDockerBuildCommand(): ReturnType<typeof cac> {
	const cli = cac('aamini docker build')
	cli.help()
	cli.version('0.0.1')

	cli
		.command('<app>', 'Build Docker image for a specific app')
		.option('-a, --all', 'Build images for all apps')
		.action(async (app: string | undefined, options: { all?: boolean }) => {
			const repoRoot = await getRepoRoot()
			const apps = options.all
				? parseApps(repoRoot, ['--all'])
				: app
					? [app]
					: []

			if (apps.length === 0) {
				console.error('Error: Specify an app name or use --all')
				process.exit(1)
			}

			for (const appName of apps) {
				await buildImage(repoRoot, appName)
			}
		})

	cli.addEventListener('command:*', () => {
		console.error(`Error: Unknown command '${cli.args[0] ?? ''}'`)
		cli.outputHelp()
		process.exit(1)
	})

	return cli
}

export function createDockerPushCommand(): ReturnType<typeof cac> {
	const cli = cac('aamini docker push')
	cli.help()
	cli.version('0.0.1')

	cli
		.command('<app>', 'Push Docker image for a specific app')
		.option('-a, --all', 'Push images for all apps')
		.action(async (app: string | undefined, options: { all?: boolean }) => {
			const repoRoot = await getRepoRoot()
			const apps = options.all
				? parseApps(repoRoot, ['--all'])
				: app
					? [app]
					: []

			if (apps.length === 0) {
				console.error('Error: Specify an app name or use --all')
				process.exit(1)
			}

			for (const appName of apps) {
				await pushImage(repoRoot, appName)
			}
		})

	cli.addEventListener('command:*', () => {
		console.error(`Error: Unknown command '${cli.args[0] ?? ''}'`)
		cli.outputHelp()
		process.exit(1)
	})

	return cli
}

export function createDockerDeployCommand(): ReturnType<typeof cac> {
	const cli = cac('aamini docker deploy')
	cli.help()
	cli.version('0.0.1')

	cli
		.command('<app>', 'Deploy a specific app')
		.option('-a, --all', 'Deploy all apps')
		.option('-r, --deploy-revision <sha>', 'Deploy specific revision')
		.action(
			async (
				app: string | undefined,
				options: { all?: boolean; deployRevision?: string },
			) => {
				const repoRoot = await getRepoRoot()

				if (!app && !options.all) {
					console.error('Error: Specify an app name or use --all')
					process.exit(1)
				}

				await runDeploy(repoRoot, options.deployRevision)
			},
		)

	cli.addEventListener('command:*', () => {
		console.error(`Error: Unknown command '${cli.args[0] ?? ''}'`)
		cli.outputHelp()
		process.exit(1)
	})

	return cli
}

export { buildImage, getImageRefs, parseApps, pushImage, runDeploy }
