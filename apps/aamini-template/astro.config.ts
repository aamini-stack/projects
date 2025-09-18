import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, fontProviders } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	integrations: [react()],
	vite: {
		// @ts-ignore
		plugins: [tailwindcss()],
	},
	output: 'server',
	adapter: vercel(),
	experimental: {
		fonts: [
			{
				provider: fontProviders.google(),
				name: 'DM Sans',
				cssVariable: '--font-dm-sans',
			},
		],
	},
})
