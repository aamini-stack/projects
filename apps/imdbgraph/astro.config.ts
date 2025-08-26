import react from '@astrojs/react'
import netlify from '@astrojs/netlify'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, envField, fontProviders } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	integrations: [react()],
	env: {
		schema: {
			DATABASE_URL: envField.string({
				context: 'server',
				access: 'secret',
			}),
			CRON_SECRET: envField.string({
				context: 'server',
				access: 'secret',
				optional: true,
			}),
		},
	},
	vite: {
		plugins: [tailwindcss()],
		// Needed to fix bug with downshift when SSR'ing on vercel.
		ssr: {
			noExternal: ['downshift'],
		},
	},
	output: 'static',
	adapter: netlify({
		edgeMiddleware: true,
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
