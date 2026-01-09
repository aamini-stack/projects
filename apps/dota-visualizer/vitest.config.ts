import { createBaseConfig } from '@aamini/config-testing/vitest'

export default createBaseConfig(
	{},
	{
		browser: {
			test: {
				browser: {
					viewport: {
						width: 1280,
						height: 720,
					},
				},
			},
		},
	},
)
