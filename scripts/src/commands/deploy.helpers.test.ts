import { describe, expect, it } from 'vitest'
import {
	buildFluxPayload,
	buildManifestTag,
	buildRenderModuleSpecifier,
} from './deploy.helpers.ts'

describe('buildManifestTag', () => {
	it('builds preview tag as <app>-manifests:pr-<pr>-<sha>', () => {
		expect(
			buildManifestTag({ app: 'imdbgraph', sha: 'abc123', prNumber: '42' }),
		).toBe('imdbgraph-manifests:pr-42-abc123')
	})

	it('builds production tag as <app>-manifests:main-<sha>', () => {
		expect(buildManifestTag({ app: 'portfolio', sha: 'def456' })).toBe(
			'portfolio-manifests:main-def456',
		)
	})
})

describe('buildFluxPayload', () => {
	it('builds preview payload with environment and pr_number', () => {
		expect(
			buildFluxPayload({
				app: 'imdbgraph',
				sha: 'abc',
				environment: 'preview',
				prNumber: '18',
			}),
		).toMatchObject({
			app: 'imdbgraph',
			sha: 'abc',
			environment: 'preview',
			pr_number: '18',
		})
	})

	it('builds production payload without pr_number', () => {
		expect(
			buildFluxPayload({
				app: 'portfolio',
				sha: 'def',
				environment: 'production',
			}),
		).toMatchObject({
			app: 'portfolio',
			sha: 'def',
			environment: 'production',
		})
	})
})

describe('buildRenderModuleSpecifier', () => {
	it('builds an absolute file URL for infra render module', () => {
		expect(buildRenderModuleSpecifier('/repo/root')).toBe(
			'file:///repo/root/packages/infra/src/gitops/render.ts',
		)
	})
})
