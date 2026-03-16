import { describe, expect, it } from 'vitest'
import { normalizeDeployReadyEvent } from './index.ts'

describe('normalizeDeployReadyEvent', () => {
	it('normalizes basic repository_dispatch', () => {
		expect(
			normalizeDeployReadyEvent({
				action: 'app_deploy_ready',
				client_payload: {
					app: 'portfolio',
					environment: 'stable',
					sha: 'deadbeef',
					url: 'https://portfolio.ariaamini.com',
				},
			}),
		).toMatchObject({
			app: 'portfolio',
			deploymentEnvironment: 'stable/portfolio',
			environmentType: 'stable',
			sha: 'deadbeef',
		})
	})

	it('normalizes preview with PR number', () => {
		expect(
			normalizeDeployReadyEvent({
				action: 'app_deploy_ready',
				client_payload: {
					app: 'portfolio',
					environment: 'preview',
					pr_number: 139,
					sha: 'cafebabe',
					url: 'https://portfolio-pr-139.ariaamini.com',
				},
			}),
		).toMatchObject({
			app: 'portfolio',
			deploymentEnvironment: 'preview/pr-139/portfolio',
			environmentType: 'preview',
			prNumber: 139,
		})
	})

	it('throws on missing required fields', () => {
		expect(() =>
			normalizeDeployReadyEvent({
				action: 'app_deploy_ready',
				client_payload: { app: 'portfolio' },
			}),
		).toThrow('Missing deploy-ready URL')
	})
})
