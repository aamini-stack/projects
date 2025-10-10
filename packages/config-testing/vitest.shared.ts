import { defineConfig, mergeConfig, type ViteUserConfig } from 'vitest/config'

interface ProjectOverrides {
	unit?: Partial<ViteUserConfig>
	browser?: Partial<ViteUserConfig>
}

export const createBaseConfig = (overrides: ProjectOverrides = {}) =>
	defineConfig({
		test: {
			passWithNoTests: true,
			projects: [
				mergeConfig(
					{
						test: {
							name: 'unit',
							include: ['src/**/*.test.ts'],
						},
					} satisfies ViteUserConfig,
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
					} satisfies ViteUserConfig,
					overrides.browser ?? {},
				),
			],
		},
	})

export const baseConfig = createBaseConfig()
