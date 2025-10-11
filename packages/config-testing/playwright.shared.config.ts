import {
	defineConfig,
	devices,
	type PlaywrightTestConfig,
} from '@playwright/test'

/** See https://playwright.dev/docs/test-configuration. */
export const baseConfig = (
	{ port }: { port: number },
	overrides?: PlaywrightTestConfig,
) => {
	const devUrl = `http://localhost:${port}`
	const useDevServer = !(process.env.CI || process.env.BASE_URL)
	const baseUrl = useDevServer ? devUrl : process.env.BASE_URL
	const testDir = './e2e'
	return defineConfig(
		{
			testDir: testDir,
			/* Run tests in files in parallel */
			fullyParallel: true,
			// Opt out of parallel tests on CI.
			workers: process.env.CI ? 1 : '50%',
			/* Fail the build on CI if you accidentally left test.only in the source code. */
			forbidOnly: !!process.env.CI,
			retries: process.env.CI ? 3 : 0,
			/* Reporter to use. See https://playwright.dev/docs/test-reporters */
			reporter: [['html', { open: 'never' }]],

			/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
			use: {
				colorScheme: 'dark',

				/* Base URL to use in actions like `await page.goto('/')`. */
				baseURL: baseUrl,

				/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
				trace: 'on-first-retry',
				screenshot: 'on',
				video: 'retain-on-failure',

				// https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation#examples
				extraHTTPHeaders: {
					'x-vercel-protection-bypass':
						process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? '',
				},
			},

			/* Run your local dev server when running tests locally */
			...(useDevServer
				? {
						webServer: {
							command: `pnpm dev --port ${port}`,
							url: devUrl,
							reuseExistingServer: true,
						},
					}
				: {}),

			expect: {
				toHaveScreenshot: {
					stylePath: `${testDir}/screenshot.css`,
					maxDiffPixelRatio: 0.001,
				},
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

				// {
				// 	name: 'firefox',
				// 	use: { ...devices['Desktop Firefox'] },
				// },

				// {
				// 	name: 'webkit',
				// 	use: { ...devices['Desktop Safari'] },
				// },

				/* Test against mobile viewports. */
				// {
				//   name: 'Mobile Chrome',
				//   use: { ...devices['Pixel 5'] },
				// },
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

				/* Test against branded browsers. */
				// {
				//   name: 'Microsoft Edge',
				//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
				// },
				// {
				//   name: 'Google Chrome',
				//   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
				// },
			],
		},
		overrides ?? {},
	)
}
