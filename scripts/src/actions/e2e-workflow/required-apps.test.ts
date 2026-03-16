import { describe, expect, it } from 'vitest'
import { selectE2ERequiredApps } from './index.ts'

describe('selectE2ERequiredApps', () => {
	it('returns all apps for flux-deploy-ready without PR', () => {
		expect(
			selectE2ERequiredApps({
				allApps: ['a', 'b'],
				app: 'x',
				changedFiles: [],
				prNumber: null,
				source: 'flux-deploy-ready',
			}),
		).toEqual(['a', 'b'])
	})

	it('returns single app for non-flux source without PR', () => {
		expect(
			selectE2ERequiredApps({
				allApps: ['a', 'b'],
				app: 'x',
				changedFiles: [],
				prNumber: null,
				source: 'other',
			}),
		).toEqual(['x'])
	})

	it('returns affected apps for PR', () => {
		expect(
			selectE2ERequiredApps({
				allApps: ['a', 'b', 'c'],
				app: 'x',
				changedFiles: ['apps/a/src/index.ts'],
				prNumber: 123,
				source: 'github',
			}),
		).toEqual(['a'])
	})
})
