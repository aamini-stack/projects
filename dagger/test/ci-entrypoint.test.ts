import { describe, expect, it } from 'vitest'
import {
	buildPublishAppReleaseChartArgs,
	buildPublishGitopsStateArgs,
	buildPublishMainAppImagesArgs,
	buildPublishPrAppImagesArgs,
} from '../src/ci-entrypoint.ts'

describe('ci entrypoint', () => {
	it('builds dagger args for gitops publishing with one tag', () => {
		const args = buildPublishGitopsStateArgs({
			registry: 'ghcr.io/aamini-stack/projects-gitops',
			tags: ['latest'],
			githubActor: 'github-actions[bot]',
		})

		expect(args).toEqual([
			'publish-gitops-state',
			'--registry=ghcr.io/aamini-stack/projects-gitops',
			'--tags=latest',
			'--github-token=env://GITHUB_TOKEN',
			'--github-actor=github-actions[bot]',
		])
	})

	it('builds dagger args for gitops publishing with multiple tags', () => {
		const args = buildPublishGitopsStateArgs({
			registry: 'ghcr.io/aamini-stack/projects-gitops',
			tags: ['latest', 'main-deadbeef'],
			githubActor: 'github-actions[bot]',
		})

		expect(args).toEqual([
			'publish-gitops-state',
			'--registry=ghcr.io/aamini-stack/projects-gitops',
			'--tags=latest',
			'--tags=main-deadbeef',
			'--github-token=env://GITHUB_TOKEN',
			'--github-actor=github-actions[bot]',
		])
	})

	it('builds dagger args for chart publishing from workflow inputs', () => {
		const args = buildPublishAppReleaseChartArgs({
			registry: 'oci://ghcr.io/aamini-stack/app-release',
			githubActor: 'github-actions[bot]',
		})

		expect(args).toEqual([
			'publish-app-release-chart',
			'--registry=oci://ghcr.io/aamini-stack/app-release',
			'--github-token=env://GITHUB_TOKEN',
			'--github-actor=github-actions[bot]',
		])
	})

	it('builds dagger args for main app image publishing from workflow inputs', () => {
		const args = buildPublishMainAppImagesArgs({
			registry: 'ghcr.io/aamini-stack',
			app: 'portfolio',
			sha: 'deadbeef',
			githubActor: 'github-actions[bot]',
		})

		expect(args).toEqual([
			'publish-app-images',
			'--registry=ghcr.io/aamini-stack',
			'--apps=portfolio',
			'--tags=latest',
			'--tags=main-deadbeef',
			'--github-token=env://GITHUB_TOKEN',
			'--github-actor=github-actions[bot]',
		])
	})

	it('builds dagger args for pr app image publishing from workflow inputs', () => {
		const args = buildPublishPrAppImagesArgs({
			registry: 'ghcr.io/aamini-stack',
			app: 'portfolio',
			prNumber: 42,
			githubActor: 'github-actions[bot]',
		})

		expect(args).toEqual([
			'publish-app-images',
			'--registry=ghcr.io/aamini-stack',
			'--apps=portfolio',
			'--tags=pr-42',
			'--github-token=env://GITHUB_TOKEN',
			'--github-actor=github-actions[bot]',
		])
	})
})
