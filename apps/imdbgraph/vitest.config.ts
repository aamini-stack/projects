import { createBaseConfig } from '@aamini/config-testing/vitest'

export default createBaseConfig(
	{},
	{
		browser: {
			optimizeDeps: {
				include: ['recharts'],
			},
		},
	},
)
