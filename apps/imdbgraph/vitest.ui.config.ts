import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		globals: true,
		name: 'ui',
		include: ['src/**/*.test.tsx'],
		environment: 'jsdom',
		setupFiles: ['./__mocks__/setup-http.ts', './__mocks__/setup-jest-dom.ts'],
	},
})
