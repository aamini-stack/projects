import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readdirSync } from 'node:fs'

const SHARED_APP_NAMES = [
	'dota-visualizer',
	'imdbgraph',
	'pc-tune-ups',
	'portfolio',
]
const repoRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'..',
	'..',
	'..',
)

function listAppDirectories(root: string): string[] {
	const appsDir = path.join(root, 'apps')

	try {
		return readdirSync(appsDir, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name)
			.sort()
	} catch {
		return []
	}
}

function resolveChangedFiles(input: {
	baseRef: string
	headRef: string
	changedFiles?: string[]
}): string[] {
	if (input.changedFiles) {
		return input.changedFiles
	}

	try {
		const stdout = execFileSync(
			'git',
			['diff', '--name-only', input.baseRef, input.headRef],
			{
				cwd: repoRoot,
				encoding: 'utf8',
			},
		)

		return stdout
			.split('\n')
			.map((file) => file.trim())
			.filter(Boolean)
	} catch {
		return []
	}
}

export async function collectChangedApps(input: {
	baseRef: string
	headRef: string
	changedFiles?: string[]
}): Promise<string[]> {
	const hasExplicitChangedFiles = input.changedFiles !== undefined
	const changedFiles = resolveChangedFiles(input)
	const appNames = new Set<string>()

	for (const file of changedFiles) {
		const match = file.match(/^apps\/([^/]+)\//)
		if (match?.[1]) {
			appNames.add(match[1])
		}

		if (
			file.startsWith('packages/ui/') ||
			file.startsWith('packages/config-')
		) {
			for (const app of SHARED_APP_NAMES) {
				appNames.add(app)
			}
		}
	}

	if (!hasExplicitChangedFiles && appNames.size === 0) {
		for (const app of listAppDirectories(repoRoot)) {
			appNames.add(app)
		}
	}

	return [...appNames].sort()
}
