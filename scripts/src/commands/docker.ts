import { $ } from 'zx'
import * as path from 'node:path'
import { mkdirSync } from 'node:fs'
import { Command } from 'commander'
import {
	assertAppExists,
	getRepoRoot,
	listAppDirectories,
} from '../helpers/repo.ts'

export function createDockerCommand(): Command {
	const cli = new Command('docker')
	cli.description('Docker utilities')

	cli.addCommand(
		new Command('build')
			.description('Build Docker image for a specific app')
			.argument('[app]', 'App name to build')
			.option('-b, --build-all', 'Build images for all apps')
			.action(
				async (app: string | undefined, options: { buildAll?: boolean }) => {
					const repoRoot = await getRepoRoot()
					const apps = options.buildAll
						? parseApps(repoRoot, ['--build-all'])
						: app
							? [app]
							: []

					if (apps.length === 0) {
						console.error('Error: Specify an app name or use --build-all')
						process.exit(1)
					}

					for (const appName of apps) {
						await buildImage(repoRoot, appName)
					}
				},
			),
	)

	cli.addCommand(
		new Command('push')
			.description('Push Docker image for a specific app')
			.argument('[app]', 'App name to push')
			.option('-p, --push-all', 'Push images for all apps')
			.action(
				async (app: string | undefined, options: { pushAll?: boolean }) => {
					const repoRoot = await getRepoRoot()
					const apps = options.pushAll
						? parseApps(repoRoot, ['--push-all'])
						: app
							? [app]
							: []

					if (apps.length === 0) {
						console.error('Error: Specify an app name or use --push-all')
						process.exit(1)
					}

					for (const appName of apps) {
						await pushImage(repoRoot, appName)
					}
				},
			),
	)

	cli.addCommand(
		new Command('deploy')
			.description('Deploy Docker container')
			.option('-d, --deploy-all', 'Deploy all apps')
			.option('-r, --deploy-revision <sha>', 'Deploy specific revision')
			.action(
				async (options: { deployAll?: boolean; deployRevision?: string }) => {
					const repoRoot = await getRepoRoot()

					if (!options.deployAll) {
						console.error('Error: Use --deploy-all to deploy all apps')
						process.exit(1)
					}

					await runDeploy(repoRoot, options.deployRevision)
				},
			),
	)

	cli.action(() => {
		cli.outputHelp()
	})

	return cli
}

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
	const runAll = args.includes('--build-all')
	const positionalArgs = args.filter((arg) => arg !== '--build-all')

	if (runAll) {
		return listAppDirectories(repoRoot)
	}

	const appName = positionalArgs[0]
	if (!appName) {
		throw new Error(
			'Usage: aamini docker build <app-name> | aamini docker build --build-all',
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

export { buildImage, getImageRefs, parseApps, pushImage, runDeploy }
