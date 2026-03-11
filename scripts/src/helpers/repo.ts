import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { $ } from 'zx'

async function getRepoRoot(): Promise<string> {
	const helpersDir = path.dirname(fileURLToPath(import.meta.url))
	const result = await $({
		cwd: helpersDir,
		nothrow: true,
		stdio: 'pipe',
	})`git rev-parse --show-toplevel`
	const repoRoot = result.stdout.trim()

	if (result.exitCode === 0 && repoRoot) {
		return repoRoot
	}

	return path.resolve(helpersDir, '..', '..')
}

function listAppDirectories(repoRoot: string): string[] {
	const appsDir = path.join(repoRoot, 'apps')
	if (!fs.existsSync(appsDir)) {
		return []
	}

	return fs
		.readdirSync(appsDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
}

function assertAppExists(repoRoot: string, app: string): void {
	const appPath = path.join(repoRoot, 'apps', app)
	if (!fs.existsSync(appPath)) {
		throw new Error(`App '${app}' not found at ${appPath}`)
	}
}

export { assertAppExists, getRepoRoot, listAppDirectories }
