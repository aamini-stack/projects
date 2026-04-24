import { createBaseConfig } from '@aamini/config-testing/vitest'
import { playwright } from '@vitest/browser-playwright'

export default createBaseConfig(
	{},
	{
		browser: {
			test: {
				include: ['src/**/*.test.tsx', 'tests/**/*.test.tsx'],
				browser: {
					ui: false,
					viewport: {
						width: 1280,
						height: 720,
					},
					provider: playwright({
						contextOptions: {
							viewport: {
								width: 1280,
								height: 1600,
							},
						},
					}),
				},
			},
		},
	},
)
