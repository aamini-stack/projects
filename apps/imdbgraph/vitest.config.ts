/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'

export default getViteConfig({
	//@ts-ignore
	test: {
		setupFiles: 'vitest.setup.ts',
		globals: true,
		environment: 'jsdom',
	},
})
