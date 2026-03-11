import { describe, expect, it } from 'vitest'
import { collectChangedApps } from '../src/preview/changed-apps.ts'

describe('changed apps planning', () => {
	it('selects only the touched app when app files change', async () => {
		const apps = await collectChangedApps({
			baseRef: 'main',
			headRef: 'main',
			changedFiles: ['apps/portfolio/src/main.ts'],
		})

		expect(apps).toEqual(['portfolio'])
	})

	it('selects all shared apps when shared package files change', async () => {
		const apps = await collectChangedApps({
			baseRef: 'main',
			headRef: 'main',
			changedFiles: ['packages/ui/button.tsx'],
		})

		expect(apps).toEqual([
			'dota-visualizer',
			'imdbgraph',
			'pc-tune-ups',
			'portfolio',
		])
	})

	it('uses all apps fallback only when running from git diff', async () => {
		const apps = await collectChangedApps({
			baseRef: 'main',
			headRef: 'main',
		})

		expect(apps).toEqual([
			'dota-visualizer',
			'imdbgraph',
			'pc-tune-ups',
			'portfolio',
		])
	})

	it('sorts app names deterministically', async () => {
		const apps = await collectChangedApps({
			baseRef: 'main',
			headRef: 'main',
			changedFiles: [
				'apps/portfolio/src/main.ts',
				'apps/dota-visualizer/src/index.ts',
				'apps/dota-visualizer/src/main.ts',
			],
		})

		expect(apps).toEqual(['dota-visualizer', 'portfolio'])
	})
})
