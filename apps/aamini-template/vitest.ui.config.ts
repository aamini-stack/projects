import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	// @ts-ignore
	plugins: [tsconfigPaths()],
	test: {
		globals: true,
		name: 'imdbgraph (ui)',
		include: ['src/**/*.test.tsx'],
		environment: 'jsdom',
		setupFiles: ['./__mocks__/setup-http.ts', './__mocks__/setup-jest-dom.ts'],
	},
})
