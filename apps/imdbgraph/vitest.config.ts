import tsconfigPaths from 'vite-tsconfig-paths'
import { defineProject } from 'vitest/config'

export default defineProject({
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
					name: 'db',
					include: ['src/**/*.test.db.ts'],
					setupFiles: ['./__mocks__/setup-db.ts'],
					environment: 'node',
					testTimeout: 30_000,
				},
			},
			{
				extends: true,
				test: {
					name: 'unit',
					include: ['src/**/*.test.ts'],
					includeSource: ['src/**/*.{js,ts,jsx,tsx}'],
				},
			},
		],
	},
})
