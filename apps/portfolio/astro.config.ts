import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, envField, fontProviders } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	integrations: [react()],
	env: {
		schema: {
			PUBLIC_POSTHOG_KEY: envField.string({
				context: 'client',
				access: 'public',
			}),
			MAILGUN_API_KEY: envField.string({
				context: 'server',
				access: 'secret',
			}),
			MAILGUN_DOMAIN: envField.string({
				context: 'server',
				access: 'secret',
			}),
		},
	},
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
			{
				provider: fontProviders.fontsource(),
				name: 'DM Mono',
				cssVariable: '--font-family-mono',
				subsets: ['latin'],
			},
		],
	},
})
