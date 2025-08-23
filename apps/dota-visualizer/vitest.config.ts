/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default getViteConfig({
	plugins: [tsconfigPaths()],
	test: {
		include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
		setupFiles: ['__mocks__/setup-http.ts'],
		globals: true,
		environment: 'jsdom',
		includeSource: ['src/**/*.{ts,tsx}'],
	},
})
