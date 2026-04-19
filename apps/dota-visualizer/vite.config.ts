import { baseConfig } from '@aamini/config-vite'
import { mergeConfig } from 'vite'

export default mergeConfig(baseConfig, {
	optimizeDeps: {
		// Pre-bundle recharts to include its CJS dependencies like lodash
		include: ['recharts'],
	},
	ssr: {
		// Bundle recharts for SSR so its CJS deps resolve correctly.
		noExternal: ['recharts'],
	},
})
