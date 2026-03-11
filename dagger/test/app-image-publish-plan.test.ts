import { describe, expect, it } from 'vitest'
import { buildAppImagePublishPlan } from '../src/images/publish.ts'

describe('buildAppImagePublishPlan', () => {
	it('builds one publish target per app and tag from the root Dockerfile', () => {
		expect(
			buildAppImagePublishPlan({
				dockerfile: 'Dockerfile',
				registry: 'ghcr.io/aamini-stack',
				apps: ['portfolio', 'notes'],
				tags: ['latest', 'main-deadbeef'],
			}),
		).toEqual({
			contextPath: '.',
			dockerfile: 'Dockerfile',
			publishes: [
				{
					app: 'portfolio',
					buildArgs: [{ name: 'APP_NAME', value: 'portfolio' }],
					references: [
						'ghcr.io/aamini-stack/portfolio:latest',
						'ghcr.io/aamini-stack/portfolio:main-deadbeef',
					],
				},
				{
					app: 'notes',
					buildArgs: [{ name: 'APP_NAME', value: 'notes' }],
					references: [
						'ghcr.io/aamini-stack/notes:latest',
						'ghcr.io/aamini-stack/notes:main-deadbeef',
					],
				},
			],
		})
	})
})
