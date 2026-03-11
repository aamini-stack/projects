#!/usr/bin/env node
import * as path from 'node:path'
import { $ } from 'zx'
import { assertAppExists, listAppDirectories } from './helpers/repo.ts'

const E2E_COMPOSE_FILE = path.resolve(
	import.meta.dirname,
	'..',
	'e2e.compose.yaml',
)

async function runE2E(repoRoot: string, args: string[]): Promise<void> {
	const runAll = args.includes('--all')
	const positionalArgs = args.filter((arg) => arg !== '--all')
	const sharedArgs = runAll ? positionalArgs : positionalArgs.slice(1)

	if (
		!runAll &&
		!(positionalArgs[0] && typeof positionalArgs[0] === 'string')
	) {
		throw new Error(
			'Usage: e2e <app-name> [playwright-args...] | e2e --all [playwright-args...]',
		)
	}

	const apps = runAll
		? listAppDirectories(repoRoot)
		: [positionalArgs[0] as string]

	for (const appName of apps) {
		assertAppExists(repoRoot, appName)
		const interactive = $({
			cwd: repoRoot,
			stdio: 'inherit',
			env: {
				...process.env,
				APP_NAME: appName,
				CI: process.env.BASE_URL || process.env.CI === 'true' ? 'true' : '',
			},
		})

		await interactive`docker compose -f ${E2E_COMPOSE_FILE} run --build --rm e2e ${sharedArgs}`
	}
}

export { runE2E }
