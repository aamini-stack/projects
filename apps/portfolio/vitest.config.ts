import { createBaseConfig } from '@aamini/config-testing/vitest'

export default createBaseConfig({
	resolve: {
		alias: {
			'astro:actions': new URL('./__mocks__/actions.ts', import.meta.url)
				.pathname,
		},
	},
})
