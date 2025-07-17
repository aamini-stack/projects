import baseConfig from '@aamini/config-playwright';
import { defineConfig } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...baseConfig,
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm run start -p 5001',
    url: 'http://localhost:5001',
    reuseExistingServer: !process.env.CI,
    cwd: '../../apps/portfolio',
  },

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5001',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
});
