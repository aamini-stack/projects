import { defineConfig, type ViteUserConfig } from 'vitest/config'

interface ProjectOverrides {
	unit?: Partial<ViteUserConfig['test']>
	browser?: Partial<ViteUserConfig['test']>
}

export const createBaseConfig = (overrides: ProjectOverrides = {}) =>
	defineConfig({
		resolve: {
			alias: {
				'astro:actions': new URL(
					'./__mocks__/astro-actions.ts',
					import.meta.url,
				).pathname,
			},
		},
		test: {
			projects: [
				{
					extends: true,
					test: {
						name: 'unit',
						include: ['src/**/*.test.ts'],
						...overrides.unit,
					},
				},
				{
					extends: true,
					test: {
						name: 'browser',
						include: ['src/**/*.test.tsx'],
						browser: {
							instances: [
								{
									browser: 'chromium',
								},
							],
							provider: 'playwright',
							enabled: true,
							headless: true,
						},
						...overrides.browser,
					},
				},
			],
		},
	})

// Keep the old export for backward compatibility
export const baseConfig = createBaseConfig()
