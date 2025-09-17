import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite'

const env = loadEnv('test', process.cwd(), '')

const devUrl = `http://localhost:4321`
const useDevServer = !process.env.CI && !env.BASE_URL
const baseUrl = useDevServer ? devUrl : env.BASE_URL

const testDir = './e2e'

/** See https://playwright.dev/docs/test-configuration. */
export default defineConfig({
	testDir: testDir,
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 3 : 0,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: [['html', { open: 'on-failure' }]],

	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		colorScheme: 'dark',

		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: baseUrl,

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},

	/* Run your local dev server when running tests locally */
	...(useDevServer
		? {
				webServer: {
					command: 'pnpm dev',
					url: devUrl,
					reuseExistingServer: true,
				},
			}
		: {}),

	expect: {
		toHaveScreenshot: {
			stylePath: `${testDir}/screenshot.css`,
		},
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
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
		// {
		//   name: 'Mobile Safari',
		//   use: { ...devices['iPhone 12'] },
		// },

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
})
