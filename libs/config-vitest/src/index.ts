import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export const sharedConfig = defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		globals: true,
		projects: [
			{
				extends: true,
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
				},
			},
		],
	},
})
