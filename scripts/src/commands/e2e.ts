import * as path from 'node:path'
import { cac } from 'cac'
import { $ } from 'zx'
import {
	assertAppExists,
	getRepoRoot,
	listAppDirectories,
} from '../helpers/repo.ts'

const E2E_COMPOSE_FILE = path.resolve(
	import.meta.dirname,
	'..',
	'e2e.compose.yaml',
)

export type E2EOptions = {
	local?: boolean
	preview?: string
	staging?: boolean
	production?: boolean
	all?: boolean
}

export function createE2ECommand(): ReturnType<typeof cac> {
	const cli = cac('aamini e2e')
	cli.version('0.0.1')
	cli.help()

	cli.command('').action(() => {
		cli.outputHelp()
	})

	cli
		.command('run <app>', 'Run e2e for a specific app')
		.option('-l, --local', 'Run e2e locally with docker compose')
		.option('-p, --preview <pr>', 'Run e2e against preview deployment')
		.option('-s, --staging', 'Run e2e against staging')
		.option('-P, --production', 'Run e2e against production')
		.action(async (app: string, options: E2EOptions) => {
			await runE2E(await getRepoRoot(), app, options)
		})

	cli
		.command('--all', 'Run e2e for all apps')
		.option('-l, --local', 'Run e2e locally with docker compose')
		.option('-p, --preview <pr>', 'Run e2e against preview deployment')
		.option('-s, --staging', 'Run e2e against staging')
		.option('-P, --production', 'Run e2e against production')
		.action(async (options: E2EOptions) => {
			const repoRoot = await getRepoRoot()
			const apps = listAppDirectories(repoRoot)
			for (const app of apps) {
				await runE2E(repoRoot, app, options)
			}
		})

	return cli
}

export function getMode(
	options: E2EOptions,
): 'local' | 'preview' | 'staging' | 'production' | null {
	const modes = [
		options.local,
		options.preview,
		options.staging,
		options.production,
	].filter(Boolean)
	if (modes.length > 1) {
		console.error(
			'Error: Specify only one of --local, --preview, --staging, --production',
		)
		process.exit(1)
	}

	if (options.local) return 'local'
	if (options.preview) return 'preview'
	if (options.staging) return 'staging'
	if (options.production) return 'production'

	return 'local'
}

export function getTargetUrl(app: string, options: E2EOptions): string {
	if (options.preview) {
		return `https://${app}-pr-${options.preview}.ariaamini.com`
	}
	if (options.staging) {
		return `https://${app}.staging.ariaamini.com`
	}
	if (options.production) {
		return `https://${app}.ariaamini.com`
	}
	return ''
}

export async function runE2E(
	repoRoot: string,
	app: string,
	options: E2EOptions,
): Promise<void> {
	const mode = getMode(options)
	const targetUrl = getTargetUrl(app, options)

	assertAppExists(repoRoot, app)

	const interactive = $({
		cwd: repoRoot,
		stdio: 'inherit',
		env: {
			...process.env,
			APP_NAME: app,
			BASE_URL: targetUrl,
			CI: targetUrl || process.env.CI === 'true' ? 'true' : '',
		},
	})

	if (mode === 'local') {
		await interactive`docker compose -f ${E2E_COMPOSE_FILE} run --build --rm e2e`
	} else {
		throw new Error(`e2e --${mode} not yet implemented`)
	}
}

export async function runE2EForAll(
	repoRoot: string,
	options: E2EOptions,
): Promise<void> {
	const apps = listAppDirectories(repoRoot)
	for (const app of apps) {
		await runE2E(repoRoot, app, options)
	}
}
