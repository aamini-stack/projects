import {
	defineConfig,
	devices,
	type PlaywrightTestConfig,
} from '@playwright/test'
import getPort from 'get-port'
import { loadEnv } from 'vite'

const PLAYWRIGHT_PORT = 'PLAYWRIGHT_PORT'

/** See https://playwright.dev/docs/test-configuration. */
export const baseConfig = async (overrides?: PlaywrightTestConfig) => {
	const resolvedPort = Number(
		process.env[PLAYWRIGHT_PORT] ||
			(process.env[PLAYWRIGHT_PORT] = String(await getPort())),
	)
	const devUrl = `http://localhost:${resolvedPort}`
	const baseUrl = process.env.BASE_URL || devUrl
	const useDevServer = !process.env.BASE_URL
	const reuseExistingServer =
		!process.env.CI && process.env.PLAYWRIGHT_REUSE_SERVER === 'true'
	const testDir = './e2e'
	return defineConfig(
		{
			testDir: testDir,
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
				baseURL: baseUrl,

				/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
				trace: 'retain-on-first-failure',
				screenshot: 'on',
				video: 'retain-on-failure',
			},

			/* Run your local dev server when running tests locally */
			...(useDevServer
				? {
						webServer: {
							command: `pnpm dev --port ${resolvedPort} --strictPort`,
							url: devUrl,
							reuseExistingServer,
							timeout: 30_000,
							env: loadEnv('development', process.cwd(), ''),
							stdout: 'pipe',
							stderr: 'pipe',
						},
					}
				: {}),

			timeout: 15_000,
			expect: {
				timeout: 5_000,
				toHaveScreenshot: {
					stylePath: `${testDir}/screenshot.css`,
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
