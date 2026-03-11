import { describe, expect, it } from 'vitest'
import { buildPublishAppImagesArgs } from '../src/ci-entrypoint.ts'

describe('app image publish entrypoint', () => {
	it('builds dagger args for app image publishing with repeated apps and tags', () => {
		const args = buildPublishAppImagesArgs({
			registry: 'ghcr.io/aamini-stack',
			apps: ['portfolio', 'notes'],
			tags: ['latest', 'main-deadbeef'],
			githubActor: 'github-actions[bot]',
		})

		expect(args).toEqual([
			'publish-app-images',
			'--registry=ghcr.io/aamini-stack',
			'--apps=portfolio',
			'--apps=notes',
			'--tags=latest',
			'--tags=main-deadbeef',
			'--github-token=env://GITHUB_TOKEN',
			'--github-actor=github-actions[bot]',
		])
	})
})
