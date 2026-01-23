import { baseConfig } from '@aamini/config-vite'
import { mergeConfig } from 'vite'

export default mergeConfig(baseConfig, {
	optimizeDeps: {
		// Pre-bundle recharts to include its CJS dependencies like lodash
		include: ['recharts'],
	},
	ssr: {
		// Bundle lodash for SSR to avoid ESM/CJS resolution issues
		// recharts depends on lodash which uses CJS without .js extensions
		noExternal: ['lodash', 'recharts'],
		optimizeDeps: {
			include: ['lodash', 'recharts'],
		},
	},
})
