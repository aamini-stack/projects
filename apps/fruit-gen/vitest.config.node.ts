import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		name: 'fruit-gen (node)',
		include: ['./src/**/*.test.ts'],
		environment: 'node',
	},
})
