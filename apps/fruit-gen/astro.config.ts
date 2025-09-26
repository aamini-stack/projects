import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, envField, fontProviders } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	integrations: [react()],
	vite: {
		// @ts-expect-error
		plugins: [tailwindcss()],
	},
	env: {
		schema: {
			USDA_API_KEY: envField.string({
				context: 'server',
				access: 'secret',
			}),
		},
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
			{
				provider: fontProviders.fontsource(),
				name: 'DM Mono',
				cssVariable: '--font-family-mono',
				subsets: ['latin'],
			},
		],
	},
})
