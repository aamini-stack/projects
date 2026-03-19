import { describe, expect, it } from 'vitest'
import { deriveDeployDecision } from './ci-deploy.ts'

describe('deriveDeployDecision', () => {
	it('marks fork PR as unchanged with fork reason', () => {
		const result = deriveDeployDecision({
			eventName: 'pull_request',
			repository: 'owner/repo',
			headRepoFullName: 'fork/repo',
			app: 'imdbgraph',
			sha: 'abc123',
			prNumber: 42,
		})

		expect(result).toEqual({
			changed: false,
			reason: 'fork-pr',
			imageTag: 'pr-42',
		})
	})

	it('marks push event as changed', () => {
		const result = deriveDeployDecision({
			eventName: 'push',
			repository: 'owner/repo',
			app: 'portfolio',
			sha: 'def456',
		})

		expect(result).toEqual({
			changed: true,
			reason: 'push-main',
			imageTag: 'main-def456',
		})
	})

	it('marks app changed when turbo includes app path', () => {
		const result = deriveDeployDecision({
			eventName: 'pull_request',
			repository: 'owner/repo',
			headRepoFullName: 'owner/repo',
			app: 'pc-tune-ups',
			sha: 'abc123',
			prNumber: 99,
			turboExitCode: 0,
			turboPackages: ['apps/pc-tune-ups'],
		})

		expect(result.changed).toBe(true)
		expect(result.reason).toBe('app-changed')
		expect(result.imageTag).toBe('pr-99')
	})

	it('marks no changed apps when turbo output is empty', () => {
		const result = deriveDeployDecision({
			eventName: 'pull_request',
			repository: 'owner/repo',
			headRepoFullName: 'owner/repo',
			app: 'portfolio',
			sha: 'abc123',
			prNumber: 100,
			turboExitCode: 0,
			turboPackages: [],
		})

		expect(result).toEqual({
			changed: false,
			reason: 'no-changed-apps',
			imageTag: 'pr-100',
		})
	})

	it('falls back to changed when turbo fails', () => {
		const result = deriveDeployDecision({
			eventName: 'pull_request',
			repository: 'owner/repo',
			headRepoFullName: 'owner/repo',
			app: 'dota-visualizer',
			sha: 'abc123',
			prNumber: 12,
			turboExitCode: 1,
		})

		expect(result).toEqual({
			changed: true,
			reason: 'turbo-detect-fallback',
			imageTag: 'pr-12',
		})
	})

	it('skips deploy for unsupported events', () => {
		const result = deriveDeployDecision({
			eventName: 'workflow_dispatch',
			repository: 'owner/repo',
			app: 'imdbgraph',
			sha: 'abc123',
		})

		expect(result).toEqual({
			changed: false,
			reason: 'unsupported-event',
			imageTag: 'main-abc123',
		})
	})
})
