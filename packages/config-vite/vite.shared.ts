import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export const baseConfig = defineConfig({
	plugins: [
		devtools(),
		nitro({
			routeRules: {
				'/assets/**': {
					headers: {
						'Cache-Control': 'public, max-age=31536000, immutable',
					},
				},
			},
			rollupConfig: {
				onwarn(warning, defaultHandler) {
					const ignored = new Set([
						'MODULE_LEVEL_DIRECTIVE',
						'EMPTY_BUNDLE',
						'EVAL',
						'CIRCULAR_DEPENDENCY',
						'THIS_IS_UNDEFINED',
					])
					if (ignored.has(warning.code ?? '')) return
					defaultHandler(warning)
				},
			},
		}),
		viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
		tailwindcss(),
		tanstackStart(),
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

	// Suppress "use client" directive warnings from third-party packages
	// https://github.com/remix-run/remix/issues/8891#issuecomment-1965244096
	build: {
		rollupOptions: {
			onwarn(warning, defaultHandler) {
				if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
				defaultHandler(warning)
			},
		},
	},

	// Required to work with devcontainers in vscode
	// https://github.com/vitejs/vite/issues/16522
	server: {
		host: '127.0.0.1',
	},
})
