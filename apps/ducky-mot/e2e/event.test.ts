import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	// Disable images for more stable tests.
	await page.route('**/*.{png,jpg,jpeg,gif}', (route) => route.abort())
	// Block YouTube domains
	await page.route(/.*youtube\.com.*/, (route) => route.abort())
	await page.goto('/')
})


test('Screenshot Gallery Header', async ({ page }) => {
	await page.goto('/events/ducky-endless-summer-2025-09-19')
	await page.waitForLoadState('networkidle')
	await expect(page).toHaveScreenshot()
})
