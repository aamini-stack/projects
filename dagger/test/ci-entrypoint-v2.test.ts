import { describe, expect, it } from 'vitest'
import { buildCiRunArgs } from '../src/ci-entrypoint.ts'

describe('ci-entrypoint staged runs', () => {
	it('builds args for artifacts mode on PR', () => {
		const args = buildCiRunArgs({
			mode: 'artifacts',
			event: 'pr',
			sha: 'f00ba7',
			prNumber: 123,
			apps: ['portfolio'],
			githubActor: 'octocat',
			registry: 'ghcr.io/aamini-stack',
		})

		expect(args).toContain('ci-run')
		expect(args).toContain('artifacts')
		expect(args).toContain('--event=pr')
		expect(args).toContain('--pr-number=123')
		expect(args).toContain('--sha=f00ba7')
		expect(args).toContain('--registry=ghcr.io/aamini-stack')
		expect(args).toContain('--github-actor=octocat')
		expect(args.join(' ')).toContain('publish-app-images')
		expect(args.join(' ')).toContain('pr-123')
	})

	it('builds args for artifacts mode on main', () => {
		const args = buildCiRunArgs({
			mode: 'artifacts',
			event: 'main',
			sha: 'f00ba7',
			apps: ['portfolio'],
			githubActor: 'octocat',
			registry: 'ghcr.io/aamini-stack',
		})

		expect(args).toContain('--event=main')
		expect(args).toContain('--tags=latest')
		expect(args).toContain('--tags=main-f00ba7')
		expect(args.join(' ')).toContain('publish-app-images')
	})

	it('builds args for preview mode on PR', () => {
		const args = buildCiRunArgs({
			mode: 'preview',
			event: 'pr',
			sha: 'f00ba7',
			prNumber: 123,
			apps: ['portfolio'],
			githubActor: 'octocat',
			registry: 'ghcr.io/aamini-stack/projects-gitops',
		})

		expect(args.join(' ')).toContain('publish-gitops-state')
		expect(args.join(' ')).toContain('pr-123')
	})

	it('builds args for release-state mode on main', () => {
		const args = buildCiRunArgs({
			mode: 'release-state',
			event: 'main',
			sha: 'f00ba7',
			apps: ['portfolio'],
			githubActor: 'octocat',
			registry: 'ghcr.io/aamini-stack/projects-gitops',
		})

		expect(args.join(' ')).toContain('publish-gitops-state')
		expect(args.join(' ')).toContain('--tags=latest')
		expect(args.join(' ')).toContain('--tags=main-f00ba7')
	})

	it('throws on invalid mode/event combination', () => {
		expect(() =>
			buildCiRunArgs({
				mode: 'release-state',
				event: 'pr',
				sha: 'f00ba7',
				apps: ['portfolio'],
				githubActor: 'octocat',
				registry: 'ghcr.io/aamini-stack/projects-gitops',
			}),
		).toThrow(/release-state.*only.*main/)
	})
})
