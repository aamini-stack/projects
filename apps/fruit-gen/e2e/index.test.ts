import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/')
})

test('home', async ({ page }) => {
	await expect(page).toHaveScreenshot({
		fullPage: true,
	})
})
