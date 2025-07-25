import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
    },
    includeSource: ['src/**/*.ts'],
    setupFiles: 'vitest.setup.ts',
  },
});
