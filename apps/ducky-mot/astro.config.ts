import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
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
	adapter: vercel(),
	experimental: {
		fonts: [
			{
				provider: fontProviders.fontsource(),
				name: 'DM Sans',
				cssVariable: '--font-family-sans',
				subsets: ['latin'],
			},
		],
	},
})
