import tsconfigPaths from 'vite-tsconfig-paths'
import { defineProject } from 'vitest/config'

export default defineProject({
	plugins: [tsconfigPaths()],
	resolve: {
		alias: {
			'astro:actions': new URL(
				'./src/__mocks__/astro-actions.ts',
				import.meta.url,
			).pathname,
		},
	},
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
