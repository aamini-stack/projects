#!/usr/bin/env node
import * as path from 'node:path'
import { $ } from 'zx'
import {
	assertAppExists,
	getRepoRoot,
	listAppDirectories,
} from './helpers/repo.ts'

async function runE2EForApp(
	repoRoot: string,
	appName: string,
	playwrightArgs: string[],
): Promise<void> {
	assertAppExists(repoRoot, appName)
	const image = `${appName}-e2e:latest`
	const skipContainerBuild =
		Boolean(process.env.BASE_URL) || process.env.CI === 'true'

	console.log(`Building e2e Docker image for ${appName}...`)

	const buildArgs = [
		'build',
		'--build-arg',
		`APP_NAME=${appName}`,
		...(skipContainerBuild ? ['--build-arg', 'CI=true'] : []),
		'--target',
		'e2e-test',
		'-f',
		'Dockerfile',
		'-t',
		image,
		'.',
	]
	await $({ cwd: repoRoot })`docker ${buildArgs}`

	console.log(`Running e2e tests for ${appName}...`)
	const appRoot = path.join(repoRoot, 'apps', appName)
	const dockerRunArgs = [
		'run',
		'--rm',
		'-e',
		'BASE_URL',
		'-e',
		'DATABASE_URL',
		'-v',
		`${path.join(appRoot, 'test-results')}:/app/apps/${appName}/test-results`,
		'-v',
		`${path.join(appRoot, 'playwright-report')}:/app/apps/${appName}/playwright-report`,
		'-v',
		`${path.join(appRoot, 'e2e')}:/app/apps/${appName}/e2e`,
		image,
		...playwrightArgs,
	]

	await $({ cwd: repoRoot })`docker ${dockerRunArgs}`
}

async function runE2E(repoRoot: string, args: string[]): Promise<void> {
	const runAll = args.includes('--all')
	const positionalArgs = args.filter((arg) => arg !== '--all')

	if (runAll) {
		const playwrightArgs = positionalArgs
		for (const appName of listAppDirectories(repoRoot)) {
			await runE2EForApp(repoRoot, appName, playwrightArgs)
		}
		return
	}

	const appName = positionalArgs[0]
	if (!appName) {
		throw new Error(
			'Usage: e2e <app-name> [playwright-args...] | e2e --all [playwright-args...]',
		)
	}

	await runE2EForApp(repoRoot, appName, positionalArgs.slice(1))
}

async function main(): Promise<void> {
	try {
		await runE2E(await getRepoRoot(), process.argv.slice(2))
	} catch (error) {
		if (error instanceof Error) {
			console.error(`Error: ${error.message}`)
		} else {
			console.error('Error:', error)
		}
		process.exitCode = 1
	}
}

if (process.argv[1] === import.meta.url.replace('file://', '')) {
	void main()
}

export { main, runE2E, runE2EForApp }
