import react from '@astrojs/react'
import node from '@astrojs/node'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, fontProviders } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	integrations: [react()],
	vite: {
		// @ts-expect-error
		plugins: [tailwindcss()],
	},
	output: 'server',
	adapter: node({
		mode: 'standalone',
	}),
	experimental: {
		fonts: [
			{
				provider: fontProviders.fontsource(),
				name: 'DM Sans',
				cssVariable: '--font-family-sans',
				subsets: ['latin'],
			},
			{
				provider: fontProviders.fontsource(),
				name: 'DM Mono',
				cssVariable: '--font-family-mono',
				subsets: ['latin'],
			},
		],
	},
})
