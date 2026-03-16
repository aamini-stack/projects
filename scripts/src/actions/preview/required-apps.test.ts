import { describe, expect, it } from 'vitest'
import { selectRequiredApps } from './index.ts'

describe('selectRequiredApps', () => {
	it('returns all apps if no files changed', () => {
		expect(
			selectRequiredApps({ allApps: ['a', 'b'], changedFiles: [] }),
		).toEqual(['a', 'b'])
	})

	it('returns all apps if file outside apps/ changed', () => {
		expect(
			selectRequiredApps({
				allApps: ['a', 'b'],
				changedFiles: ['packages/utils/index.ts'],
			}),
		).toEqual(['a', 'b'])
	})

	it('returns only affected apps', () => {
		expect(
			selectRequiredApps({
				allApps: ['a', 'b', 'c'],
				changedFiles: ['apps/a/src/index.ts'],
			}),
		).toEqual(['a'])
	})

	it('sorts results alphabetically', () => {
		expect(
			selectRequiredApps({
				allApps: ['c', 'a', 'b'],
				changedFiles: ['apps/c/src/index.ts', 'apps/a/src/index.ts'],
			}),
		).toEqual(['a', 'c'])
	})
})
