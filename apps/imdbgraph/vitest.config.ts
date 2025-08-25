import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineProject } from 'vitest/config'

export default defineProject({
	plugins: [tsconfigPaths()],
	test: {
		globals: true,
		projects: [
			{
				test: {
					include: ['src/**/*.test.ts'],
					name: 'node',
					environment: 'node',
					testTimeout: 30_000,
				},
			},
			{
				plugins: [react()],
				extends: true,
				test: {
					include: ['src/**/*.test.tsx'],
					name: 'ui',
					environment: 'jsdom',
					testTimeout: 5_000,
					setupFiles: ['__mocks__/setup-db.ts', '__mocks__/setup-http.ts'],
				},
			},
		],
	},
})
