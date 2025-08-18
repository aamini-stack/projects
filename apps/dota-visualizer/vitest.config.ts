/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'

export default getViteConfig({
	test: {
		include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
		setupFiles: ['__mocks__/setup-http.ts', '__mocks__/setup-jest-dom.ts'],
		globals: true,
		environment: 'jsdom',
		includeSource: ['src/**/*.{js,ts}'],
	},
})
