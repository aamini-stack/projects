import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, envField, fontProviders } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	integrations: [react()],
	vite: {
		// @ts-ignore
		plugins: [tailwindcss()],
	},
	env: {
		schema: {
			PUBLIC_POSTHOG_KEY: envField.string({
				context: 'client',
				access: 'public',
			}),
		},
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
