import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { varlockVitePlugin } from '@varlock/vite-integration'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

export const baseConfig = defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
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
		tailwindcss(),
		tanstackStart(),
		varlockVitePlugin({ ssrInjectMode: 'auto-load' }),
		viteReact({
			babel: {
				plugins: ['babel-plugin-react-compiler'],
			},
		} as Parameters<typeof viteReact>[0]),
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
		watch: {
			ignored: ['**/.playwright/**', '**/playwright-report/**'],
		},
	},
})
