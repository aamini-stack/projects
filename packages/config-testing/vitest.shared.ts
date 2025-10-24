import {
	defineConfig,
	mergeConfig,
	type TestProjectConfiguration,
	type TestProjectInlineConfiguration,
	type ViteUserConfig,
} from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

interface ProjectOverrides {
	server?: Partial<ViteUserConfig>
	browser?: Partial<ViteUserConfig>
}

export const createBaseConfig = (
	overrides: TestProjectInlineConfiguration,
	projectOverrides: ProjectOverrides = {},
) =>
	mergeConfig(
		defineConfig({
			plugins: [tsconfigPaths()],
			test: {
				passWithNoTests: true,
				projects: [
					{
						extends: true,
						test: {
							name: 'unit',
							include: ['src/**/*.test.unit.ts'],
						},
					},
					mergeConfig(
						{
							extends: true,
							test: {
								name: 'server',
								include: ['src/**/*.test.ts'],
								testTimeout: 30_000,
							},
						} satisfies TestProjectConfiguration,
						projectOverrides.server ?? {},
					),
					mergeConfig(
						{
							extends: true,
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
						} satisfies TestProjectConfiguration,
						projectOverrides.browser ?? {},
					),
				],
			},
		}),
		overrides,
	)

export const baseConfig = createBaseConfig({})
