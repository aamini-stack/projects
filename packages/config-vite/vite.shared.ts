import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { varlockVitePlugin } from '@varlock/vite-integration'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'
import babel from '@rolldown/plugin-babel'

export const baseConfig = defineConfig({
	resolve: {
		tsconfigPaths: true,
		dedupe: ['react', 'react-dom'],
	},
	ssr: {
		noExternal: ['recharts'],
	},
	plugins: [
		devtools(),
		nitro(),
		tailwindcss(),
		tanstackStart(),
		varlockVitePlugin({ ssrInjectMode: 'auto-load' }),
		viteReact(),
		babel({ presets: [reactCompilerPreset()] }),
		svgr({
			include: '**/*.svg',
			svgrOptions: { exportType: 'default' },
		}),
	],
})
