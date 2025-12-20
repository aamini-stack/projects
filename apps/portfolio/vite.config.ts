import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	plugins: [
		devtools(),
		nitro(),
		viteTsConfigPaths({
			projects: ['./tsconfig.json'],
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		svgr({
			include: '**/*.svg',
			svgrOptions: {
				exportType: 'default',
			},
		}),
	],
})
