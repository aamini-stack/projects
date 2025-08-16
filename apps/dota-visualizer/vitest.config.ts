/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'

export default getViteConfig({
	test: {
		include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)', '!tests/**'],
		setupFiles: 'vitest.setup.ts',
		globals: true,
		environment: 'jsdom',
		includeSource: ['src/**/*.{js,ts}'],
	},
})
