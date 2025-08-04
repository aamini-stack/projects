import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    // @ts-expect-error Temp ignore type error. (Works in runtime)
    plugins: [tailwindcss()],
  },
  adapter: node({ mode: 'standalone' }),
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
