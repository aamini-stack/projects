import { defineConfig, fontProviders } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import vercel from '@astrojs/vercel'

// https://astro.build/config
export default defineConfig({
	integrations: [react()],
	vite: {
		plugins: [tailwindcss()],
	},
	output: 'static',
	adapter: vercel({
		edgeMiddleware: true,
		webAnalytics: {
			enabled: true,
		},
	}),
	experimental: {
		fonts: [
			{
				provider: fontProviders.google(),
				name: 'Inter',
				cssVariable: '--font-inter',
			},
		],
	},
})
