import * as path from 'node:path'
import { Command } from 'commander'
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
	wait?: boolean
}

export function createE2ECommand(): Command {
	const cli = new Command('e2e')
	cli.description('Run e2e tests')

	cli.addCommand(
		new Command('run')
			.description('Run e2e for a specific app or all apps')
			.argument('[app]', 'App name to run e2e for')
			.option('-l, --local', 'Run e2e locally with docker compose')
			.option('-p, --preview <pr>', 'Run e2e against preview deployment')
			.option('-s, --staging', 'Run e2e against staging')
			.option('-P, --production', 'Run e2e against production')
			.option('-a, --all', 'Run e2e for all apps')
			.option('--wait', 'Wait for deployment to be ready before running tests')
			.action(
				async (
					app: string | undefined,
					options: E2EOptions & { all?: boolean },
				) => {
					const repoRoot = await getRepoRoot()
					const apps = options.all
						? listAppDirectories(repoRoot)
						: app
							? [app]
							: []
					if (apps.length === 0) {
						console.error('Error: Specify an app name or use --all')
						process.exit(1)
					}
					for (const appName of apps) {
						await runE2E(repoRoot, appName, options)
					}
				},
			),
	)

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

	// Wait for deployment if requested
	if (options.wait && targetUrl) {
		console.log(`Waiting for ${app} deployment at ${targetUrl}...`)
		await waitForDeployment(targetUrl)
	}

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
		// Run e2e against deployed environment
		await interactive`pnpm --dir ${path.join('apps', app)} exec playwright install --with-deps chromium`
		await interactive`pnpm --dir ${path.join('apps', app)} exec playwright test`
	}
}

async function waitForDeployment(url: string): Promise<void> {
	const maxAttempts = 60
	const delaySeconds = 10

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const response = await fetch(url, {
				method: 'GET',
				redirect: 'follow',
			})

			if (response.ok) {
				console.log(`✅ Deployment ready at ${url}`)
				return
			}
		} catch {
			// Connection failed, keep waiting
		}

		if (attempt >= maxAttempts) {
			throw new Error(
				`Timeout waiting for deployment at ${url} after ${maxAttempts} attempts`,
			)
		}

		console.log(`Waiting... (${attempt}/${maxAttempts})`)
		await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000))
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
