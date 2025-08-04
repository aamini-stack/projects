import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  env: {
    schema: {
      DATABASE_URL: envField.string({ context: 'server', access: 'secret' }),
      CRON_SECRET: envField.string({ context: 'server', access: 'secret' }),
    },
  },
  vite: {
    // @ts-expect-error erronous API type error. (Works at runtime)
    plugins: [tailwindcss()],
    // Needed to fix bug with downshift when SSR'ing on vercel.
    ssr: {
      noExternal: ['downshift'],
    },
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
});
