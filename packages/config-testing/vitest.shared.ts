import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'
import {
	defineConfig,
	mergeConfig,
	type TestProjectConfiguration,
	type TestProjectInlineConfiguration,
	type ViteUserConfig,
} from 'vitest/config'

const HANDLER_LOCATIONS = [
	'__mocks__/handlers.ts',
	'__mocks__/handlers.js',
	'src/mocks/handlers.ts',
	'src/mocks/handlers.js',
]

const STYLES_LOCATIONS = ['src/styles.css', 'src/index.css', 'src/app.css']

function mswHandlersPlugin(): Plugin {
	const virtualModuleId = '@test/handlers'
	const resolvedVirtualModuleId = '\0' + virtualModuleId

	return {
		name: 'msw-handlers-resolver',
		resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId
			}
			return undefined
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				const cwd = process.cwd()
				for (const location of HANDLER_LOCATIONS) {
					const fullPath = resolve(cwd, location)
					if (existsSync(fullPath)) {
						return `export { default } from '${fullPath}'`
					}
				}
				throw new Error(
					`No MSW handlers found. Expected one of:\n${HANDLER_LOCATIONS.map((l) => `  - ${resolve(cwd, l)}`).join('\n')}`,
				)
			}
			return undefined
		},
	}
}

function stylesPlugin(): Plugin {
	const virtualModuleId = '@test/styles'
	const resolvedVirtualModuleId = '\0' + virtualModuleId

	return {
		name: 'styles-resolver',
		resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId
			}
			return undefined
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				const cwd = process.cwd()
				for (const location of STYLES_LOCATIONS) {
					const fullPath = resolve(cwd, location)
					if (existsSync(fullPath)) {
						return `import '${fullPath}'`
					}
				}
				throw new Error(
					`No styles file found. Expected one of:\n${STYLES_LOCATIONS.map((l) => `  - ${resolve(cwd, l)}`).join('\n')}`,
				)
			}
			return undefined
		},
	}
}

const stylesSetup = new URL('setup/styles.ts', import.meta.url).pathname

// Auto-detect app-level vitest.setup.ts for custom setup (e.g., MSW server)
const localSetup = resolve(process.cwd(), 'vitest.setup.ts')
const hasLocalSetup = existsSync(localSetup)

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
				tailwindcss(),
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
							plugins: [mswHandlersPlugin()],
							test: {
								name: 'server',
								include: ['src/**/*.test.ts'],
								testTimeout: 30_000,
								fileParallelism: !process.env.CI,
								setupFiles: hasLocalSetup ? [localSetup] : [],
							},
						} satisfies TestProjectConfiguration,
						projectOverrides.server ?? {},
					),
					mergeConfig(
						{
							extends: true,
							plugins: [mswHandlersPlugin(), stylesPlugin()],
							test: {
								name: 'browser',
								include: ['src/**/*.test.tsx'],
								setupFiles: [stylesSetup],
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
