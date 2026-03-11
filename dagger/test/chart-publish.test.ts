import { describe, expect, it } from 'vitest'
import { buildPublishAppReleaseChartArgs } from '../src/ci-entrypoint.ts'

describe('chart publish entrypoint', () => {
	it('builds dagger args for app release chart publishing', () => {
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
})
