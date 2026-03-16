import { describe, expect, it } from 'vitest'

import { normalizeDeployReadyEvent } from './deploy-ready.ts'

describe('normalizeDeployReadyEvent', () => {
	it('normalizes direct repository_dispatch payloads', () => {
		expect(
			normalizeDeployReadyEvent({
				action: 'app_deploy_ready',
				client_payload: {
					app: 'portfolio',
					environment: 'stable',
					image_tag: 'main-deadbeef',
					sha: 'deadbeef',
					source: 'flux-deploy-ready',
					url: 'https://portfolio.ariaamini.com',
				},
			}),
		).toEqual({
			app: 'portfolio',
			environment: 'stable',
			eventType: 'app_deploy_ready',
			imageTag: 'main-deadbeef',
			prNumber: null,
			sha: 'deadbeef',
			source: 'flux-deploy-ready',
			url: 'https://portfolio.ariaamini.com',
		})
	})

	it('normalizes Flux githubdispatch payloads from HelmRelease annotations', () => {
		expect(
			normalizeDeployReadyEvent({
				action: 'HelmRelease/portfolio-pr-139.app-preview',
				client_payload: {
					involvedObject: {
						kind: 'HelmRelease',
						name: 'portfolio-pr-139',
						namespace: 'app-preview',
					},
					metadata: {
						app: 'portfolio',
						change_request: '139',
						commit: 'cafebabe',
						environment: 'preview',
						image_tag: 'pr-139',
						source: 'flux-deploy-ready',
						url: 'https://portfolio-pr-139.ariaamini.com',
					},
				},
			}),
		).toEqual({
			app: 'portfolio',
			environment: 'preview',
			eventType: 'HelmRelease/portfolio-pr-139.app-preview',
			imageTag: 'pr-139',
			prNumber: 139,
			sha: 'cafebabe',
			source: 'flux-deploy-ready',
			url: 'https://portfolio-pr-139.ariaamini.com',
		})
	})

	it('rejects missing required fields', () => {
		expect(() =>
			normalizeDeployReadyEvent({
				action: 'app_deploy_ready',
				client_payload: {
					app: 'portfolio',
				},
			}),
		).toThrow('Missing deploy-ready URL')
	})
})
