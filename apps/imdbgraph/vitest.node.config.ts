import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		name: 'node',
		include: ['src/**/*.test.ts'],
		environment: 'node',
		testTimeout: 30_000,
	},
})
