// @ts-check
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		globals: true,
		projects: [
			'apps/*',
			{
				extends: true,
				test: {
					name: 'node',
					include: ['src/**/*.test.ts'],
					environment: 'node',
					testTimeout: 30_000,
				},
			},
			{
				plugins: [react()],
				extends: true,
				test: {
					name: 'ui',
					include: ['src/**/*.test.tsx'],
					setupFiles: [
						'__mocks__/setup-jest-dom.ts',
						'__mocks__/setup-http.ts',
					],
					environment: 'jsdom',
				},
			},
		],
	},
})
