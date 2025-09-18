import tsconfigPaths from 'vite-tsconfig-paths'
import { defineProject } from 'vitest/config'

export default defineProject({
	plugins: [tsconfigPaths()],
	test: {
		projects: [
			{
				extends: true,
				test: {
					name: 'unit',
					include: ['src/**/*.test.ts'],
					setupFiles: ['./__mocks__/setup-http.ts'],
				},
			},
		],
	},
})
