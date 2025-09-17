import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	// @ts-ignore
	plugins: [tsconfigPaths()],
	test: {
		name: 'imdbgraph (node)',
		include: ['src/**/*.test.ts'],
		environment: 'node',
		testTimeout: 30_000,
	},
})
