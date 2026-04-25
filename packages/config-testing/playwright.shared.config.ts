import {
	defineConfig,
	devices,
	type PlaywrightTestConfig,
} from '@playwright/test'

/** See https://playwright.dev/docs/test-configuration. */
export const baseConfig = async (overrides?: PlaywrightTestConfig) => {
	return defineConfig(
		{
			testDir: './e2e',
			outputDir: '.playwright/test-results',
			/* Run tests in files in parallel */
			fullyParallel: true,
			// Opt out of parallel tests on CI.
			workers: process.env.CI ? 1 : '50%',
			/* Fail the build on CI if you accidentally left test.only in the source code. */
			forbidOnly: !!process.env.CI,
			retries: process.env.CI ? 3 : 0,
			/* Reporter to use. See https://playwright.dev/docs/test-reporters */
			reporter: [
				['html', { open: 'never', outputFolder: '.playwright/report' }],
			],

			/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
			use: {
				colorScheme: 'dark',

				/* Base URL to use in actions like `await page.goto('/')`. */
				baseURL: process.env.BASE_URL,

				/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
				trace: 'retain-on-first-failure',
				screenshot: 'on',
				video: 'retain-on-failure',
			},

			timeout: 15_000,
			expect: {
				timeout: 5_000,
			},

			/* Configure projects for major browsers */
			projects: [
				{
					name: 'chromium',
					use: {
						...devices['Desktop Chrome'],
						launchOptions: {
							args: ['--disable-lcd-text'],
						},
					},
				},
				{
					name: 'mobile',
					use: {
						...devices['Desktop Chrome'],
						viewport: {
							width: 320,
							height: 800,
						},
						launchOptions: {
							args: ['--disable-lcd-text'],
						},
					},
				},
			],
		},
		overrides ?? {},
	)
}
