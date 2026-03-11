import { describe, expect, it } from 'vitest'
import { summarizeCiRunPlan } from '../src/index.ts'

describe('ci plan logging', () => {
	it('logs changed apps and target tags for artifact runs', () => {
		const summary = summarizeCiRunPlan({
			mode: 'artifacts',
			event: 'pr',
			tags: ['pr-123'],
			apps: ['dota-visualizer', 'imdbgraph'],
			publishTarget: 'publish-app-images',
			publishArgs: [
				'--apps=dota-visualizer',
				'--apps=imdbgraph',
				'--tags=pr-123',
			],
			skipped: false,
		})

		expect(summary).toContain('ci-run mode=artifacts')
		expect(summary).toContain('apps=dota-visualizer,imdbgraph')
		expect(summary).toContain('publish=publish-app-images')
		expect(summary).toContain('--tags=pr-123')
		expect(summary).toContain('tags=pr-123')
	})

	it('logs skipped runs clearly', () => {
		const summary = summarizeCiRunPlan({
			mode: 'artifacts',
			event: 'pr',
			tags: ['pr-123'],
			apps: [],
			publishTarget: 'publish-app-images',
			publishArgs: [],
			skipped: true,
		})

		expect(summary).toContain('skipped: no changes detected')
		expect(summary).toContain('apps=none')
	})
})
