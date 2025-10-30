import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, envField } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	integrations: [react()],
	env: {
		schema: {
			PUBLIC_POSTHOG_KEY: envField.string({
				context: 'client',
				access: 'public',
			}),
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
		// @ts-expect-error
		plugins: [tailwindcss()],
		// Needed to fix bug with downshift when SSR'ing on vercel.
		ssr: {
			noExternal: ['downshift'],
		},
	},
	output: 'server',
	adapter: vercel(),
})
