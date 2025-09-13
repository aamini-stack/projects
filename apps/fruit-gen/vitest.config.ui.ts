import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		name: 'fruit-gen (ui)',
		include: ['./src/**/*.test.tsx'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./__mocks__/setup-jsdom.ts'],
	},
})
