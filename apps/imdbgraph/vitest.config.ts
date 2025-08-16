/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'

export default getViteConfig({
	test: {
		globals: true,
		projects: [
			{
				extends: true,
				test: {
					name: 'unit',
					include: ['src/**/*.test.tsx'],
					setupFiles: [
						'__mocks__/setup-jest-dom.ts',
						'__mocks__/setup-http.ts',
					],
					environment: 'jsdom',
				},
			},
			{
				extends: true,
				test: {
					name: 'db',
					include: ['src/**/*.test.ts'],
					environment: 'node',
					testTimeout: 30_000,
				},
			},
		],
	},
})
