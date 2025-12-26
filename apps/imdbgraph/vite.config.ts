import { baseConfig } from '@aamini/config-vite'
import { defineConfig, mergeConfig } from 'vite'

export default mergeConfig(
	baseConfig,
	defineConfig({
		ssr: {
			noExternal: ['recharts', 'lodash'],
		},
	}),
)
