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
			deploymentEnvironment: 'stable/portfolio',
			deploymentId: null,
			environmentType: 'stable',
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
			deploymentEnvironment: 'preview/pr-139/portfolio',
			deploymentId: null,
			environmentType: 'preview',
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

	it('normalizes deployment id when provided', () => {
		expect(
			normalizeDeployReadyEvent({
				action: 'app_deploy_ready',
				client_payload: {
					app: 'imdbgraph',
					deployment_id: '12345',
					environment: 'preview',
					pr_number: '77',
					sha: 'deadbeef',
					url: 'https://imdbgraph-pr-77.ariaamini.com',
				},
			}),
		).toMatchObject({
			app: 'imdbgraph',
			deploymentEnvironment: 'preview/pr-77/imdbgraph',
			deploymentId: 12345,
			environmentType: 'preview',
		})
	})

	it('normalizes deployment_status webhook payloads', () => {
		expect(
			normalizeDeployReadyEvent({
				action: 'created',
				deployment: {
					id: 6789,
					environment: 'preview/pr-141/portfolio',
					payload: {
						app: 'portfolio',
						image_tag: 'pr-141',
						pr_number: 141,
						source: 'preview-controller',
					},
					sha: 'cafebabedeadbeef',
				},
				deployment_status: {
					environment_url: 'https://portfolio-pr-141.ariaamini.com',
					state: 'success',
				},
			}),
		).toEqual({
			app: 'portfolio',
			deploymentEnvironment: 'preview/pr-141/portfolio',
			deploymentId: 6789,
			environmentType: 'preview',
			eventType: 'created',
			imageTag: 'pr-141',
			prNumber: 141,
			sha: 'cafebabedeadbeef',
			source: 'preview-controller',
			url: 'https://portfolio-pr-141.ariaamini.com',
		})
	})
})
