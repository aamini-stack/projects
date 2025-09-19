import { createBaseConfig } from '@aamini/config-testing/vitest'
import { defineConfig, mergeConfig } from 'vitest/config'

const baseConfig = createBaseConfig()

export default mergeConfig(
	baseConfig,
	defineConfig({
		resolve: {
			alias: {
				'astro:actions': new URL('./__mocks__/actions.ts', import.meta.url).pathname
			}
		}
	})
)
