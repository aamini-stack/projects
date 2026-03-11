import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(import.meta.dirname, '..', '..')

describe('ci workflow', () => {
	it('defines a staged graph for checks, artifacts, and preview/release', () => {
		const workflow = readFileSync(
			path.join(repoRoot, '.github/workflows/ci.yml'),
			'utf8',
		)

		expect(workflow).toContain('checks:')
		expect(workflow).toContain('artifacts:')
		expect(workflow).toContain('preview:')
		expect(workflow).toContain('e2e:')
		expect(workflow).toContain('release-state:')
	})

	it('removes per-app image publish matrix jobs', () => {
		const workflow = readFileSync(
			path.join(repoRoot, '.github/workflows/ci.yml'),
			'utf8',
		)

		expect(workflow).not.toContain('strategy:')
		expect(workflow).not.toContain('app-images-main')
		expect(workflow).not.toContain('app-images-pr')
		expect(workflow).not.toContain('publish-app-images')
	})

	it('uses staged dagger commands for publish and gitops orchestration', () => {
		const workflow = readFileSync(
			path.join(repoRoot, '.github/workflows/ci.yml'),
			'utf8',
		)

		expect(workflow).toContain('ci-run')
		expect(workflow).toContain('ci-run --mode=artifacts')
		expect(workflow).toContain('ci-run --mode=preview')
		expect(workflow).toContain('ci-run --mode=release-state')
		expect(workflow).not.toContain('publish-app-images')
		expect(workflow).not.toContain('publish-gitops-state')
	})
})
