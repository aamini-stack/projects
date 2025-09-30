import { defineConfig, mergeConfig, type ViteUserConfig } from 'vitest/config'

interface ProjectOverrides {
	unit?: Partial<ViteUserConfig['test']>
	browser?: Partial<ViteUserConfig['test']>
}

export const createBaseConfig = (overrides: ProjectOverrides = {}) =>
	defineConfig({
		test: {
			projects: [
				{
					test: mergeConfig(
						{
							name: 'unit',
							include: ['src/**/*.test.ts'],
						},
						overrides.unit ?? {},
					),
				},
				{
					test: mergeConfig(
						{
							name: 'browser',
							include: ['src/**/*.test.tsx'],
							environment: 'browser',
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
						},
						overrides.browser ?? {},
					),
				},
			],
		},
	})

// Keep the old export for backward compatibility
export const baseConfig = createBaseConfig()
