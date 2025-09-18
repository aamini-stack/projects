import tsconfigPaths from 'vite-tsconfig-paths'
import { defineProject } from 'vitest/config'

export default defineProject({
	// @ts-ignore
	plugins: [tsconfigPaths()],
	test: {
		projects: [
			{
				extends: true,
				test: {
					name: 'browser',
					include: ['src/**/*.test.tsx'],
					browser: {
						instances: [
							{
								browser: 'chromium',
							},
						],
						provider: 'playwright',
						enabled: true,
						headless: true,
					},
				},
			},
			{
				extends: true,
				test: {
					name: 'unit',
					include: ['src/**/*.test.ts'],
					environment: 'node',
				},
			},
		],
	},
})
