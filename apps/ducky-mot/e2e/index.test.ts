import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	// Disable images for more stable tests.
	await page.route('**/*.{png,jpg,jpeg,gif}', (route) => route.abort())
	// Block YouTube domains
	await page.route(/.*youtube\.com.*/, (route) => route.abort())
	await page.goto('/', { waitUntil: 'networkidle' })
})

test('Screenshot Hero', async ({ page }) => {
	await page.waitForLoadState('networkidle')
	await expect(page).toHaveScreenshot()
})

test('Screenshot Full Page', async ({ page }) => {
	await page.waitForLoadState('networkidle')
	await expect(page).toHaveScreenshot({
		fullPage: true,
		maxDiffPixelRatio: 0.01,
	})
})
