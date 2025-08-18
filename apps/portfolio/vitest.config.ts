/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'

export default getViteConfig({
	test: {
		include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
		setupFiles: ['__mocks__/setup-jsdom.ts'],
		globals: true,
		environment: 'jsdom',
	},
})
