import { createBaseConfig } from '@aamini/config-testing/vitest'
import { defineProject, mergeConfig } from 'vitest/config'

export default mergeConfig(
	createBaseConfig({ browser: { setupFiles: ['./__mocks__/setup-http.ts'] } }),
	defineProject({
		test: {
			projects: [
				{
					extends: true,
					test: {
						name: 'db',
						include: ['src/**/*.db.test.ts'],
						setupFiles: ['./__mocks__/setup-db.ts'],
						testTimeout: 30_000,
					},
				},
			],
		},
	}),
)
