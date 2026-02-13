import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/', { waitUntil: 'networkidle' })
})

test('Screenshot Homepage', async ({ page }) => {
	await expect(page).toHaveScreenshot()
})
