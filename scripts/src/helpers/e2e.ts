import * as path from 'node:path'
import { $ } from 'zx'
import { assertAppExists, listAppDirectories } from './repo.ts'

const E2E_COMPOSE_FILE = path.resolve(
	import.meta.dirname,
	'..',
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
