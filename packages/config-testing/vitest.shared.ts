import { defineConfig, mergeConfig, type ViteUserConfig } from 'vitest/config'

interface ProjectOverrides {
	unit?: Partial<ViteUserConfig>
	browser?: Partial<ViteUserConfig>
}

export const createBaseConfig = (overrides: ProjectOverrides = {}) =>
	defineConfig({
		test: {
			projects: [
				mergeConfig(
					{
						test: {
							name: 'unit',
							include: ['src/**/*.test.ts'],
						},
					},
					overrides.unit ?? {},
				),
				mergeConfig(
					{
						test: {
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
					},
					overrides.browser ?? {},
				),
			],
		},
	})

// Keep the old export for backward compatibility
export const baseConfig = createBaseConfig()
