import { describe, expect, it } from 'vitest'
import { buildGitopsBundleFiles } from '../src/gitops/render.ts'

describe('buildGitopsBundleFiles', () => {
	it('returns the staged gitops files as an in-memory file map', () => {
		const files = buildGitopsBundleFiles({
			controllers: 'kind: Namespace\nmetadata:\n  name: platform-controllers\n',
			networking: 'kind: Namespace\nmetadata:\n  name: flux-system\n',
			previews: 'kind: Namespace\nmetadata:\n  name: app-preview\n',
			apps: [
				{
					name: 'portfolio',
					namespace: 'portfolio',
					image: {
						repository: 'ghcr.io/aamini-stack/portfolio',
						policy: 'portfolio',
					},
					stable: {
						host: 'portfolio.ariaamini.com',
					},
					preview: {
						enabled: true,
					},
				},
			],
		})

		expect(files).toMatchObject({
			'bootstrap/sync.yaml': expect.stringContaining('name: platform-crds'),
			'apps/kustomization.yaml': expect.stringContaining('- applications.yaml'),
			'apps/applications.yaml': expect.stringContaining('name: portfolio'),
			'platform-controllers/controllers.yaml': expect.stringContaining(
				'name: platform-controllers',
			),
			'platform-config/networking.yaml':
				expect.stringContaining('name: flux-system'),
			'platform-config/previews.yaml':
				expect.stringContaining('name: app-preview'),
		})
	})
})
