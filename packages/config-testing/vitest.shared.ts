import viteReact from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { loadEnv } from 'vite'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'
import {
	defineConfig,
	mergeConfig,
	type TestProjectConfiguration,
	type TestProjectInlineConfiguration,
	type ViteUserConfig,
} from 'vitest/config'

const env = loadEnv('test', process.cwd(), '')

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
			plugins: [
				tsconfigPaths(),
				viteReact({
					babel: {
						plugins: ['babel-plugin-react-compiler'],
					},
				}),
				svgr({
					include: '**/*.svg',
					svgrOptions: { exportType: 'default' },
				}),
			],
			test: {
				passWithNoTests: true,
				setupFiles: 'vitest.setup.ts',
				env: env,
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
