import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { parseApps, sealAll } from './secrets.ts'

const tempDirs: string[] = []

afterEach(() => {
	for (const dir of tempDirs.splice(0)) {
		fs.rmSync(dir, { recursive: true, force: true })
	}
})

function createRepoFixture(): string {
	const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'aamini-secrets-'))
	tempDirs.push(repoRoot)

	fs.mkdirSync(path.join(repoRoot, 'apps', 'imdbgraph'), { recursive: true })
	fs.mkdirSync(path.join(repoRoot, 'apps', 'portfolio'), { recursive: true })
	fs.mkdirSync(
		path.join(repoRoot, 'packages', 'infra', 'manifests', 'apps', 'stable'),
		{ recursive: true },
	)
	fs.writeFileSync(
		path.join(repoRoot, 'apps', 'imdbgraph', '.env.local'),
		'DATABASE_URL=postgresql://example\n',
	)
	fs.writeFileSync(
		path.join(
			repoRoot,
			'packages',
			'infra',
			'manifests',
			'apps',
			'stable',
			'imdbgraph-sealed-secret.yaml',
		),
		'placeholder\n',
	)

	return repoRoot
}

describe('parseApps', () => {
	it('returns a single app when given by name', () => {
		const repoRoot = createRepoFixture()

		expect(parseApps(repoRoot, ['imdbgraph'])).toEqual(['imdbgraph'])
	})

	it('returns every app when --all is passed', () => {
		const repoRoot = createRepoFixture()

		expect(parseApps(repoRoot, ['--all'])).toEqual(['imdbgraph', 'portfolio'])
	})
})

describe('sealAll', () => {
	it('syncs the stable manifest when a matching file exists', async () => {
		const repoRoot = createRepoFixture()
		const sealedYaml = 'apiVersion: bitnami.com/v1alpha1\nkind: SealedSecret\n'

		await sealAll(repoRoot, {
			apps: ['imdbgraph'],
			runCommand: async ({ command }) => {
				if (command[0] === 'kubeseal' && command.includes('--fetch-cert')) {
					return { stdout: 'cert' }
				}

				if (command[0] === 'kubectl') {
					return { stdout: 'apiVersion: v1\nkind: Secret\n' }
				}

				return { stdout: sealedYaml }
			},
		})

		expect(
			fs.readFileSync(
				path.join(repoRoot, 'apps', 'imdbgraph', 'k8s', 'sealed-secret.yaml'),
				'utf8',
			),
		).toBe(sealedYaml)
		expect(
			fs.readFileSync(
				path.join(
					repoRoot,
					'packages',
					'infra',
					'manifests',
					'apps',
					'stable',
					'imdbgraph-sealed-secret.yaml',
				),
				'utf8',
			),
		).toBe(sealedYaml)
	})
})
