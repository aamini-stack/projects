import { playwright } from '@vitest/browser-playwright'
import tsconfigPaths from 'vite-tsconfig-paths'
import {
	defineConfig,
	mergeConfig,
	type TestProjectConfiguration,
	type TestProjectInlineConfiguration,
	type ViteUserConfig,
} from 'vitest/config'

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
				reporters: process.env.CI ? ['verbose', 'github-actions'] : ['default'],
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
								fileParallelism: !process.env.CI,
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
								setupFiles: 'vitest.setup.ts',
								browser: {
									instances: [
										{
											browser: 'chromium',
										},
									],
									provider: playwright(),
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
