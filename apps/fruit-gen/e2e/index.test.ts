import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/')
})

test('weekly', async ({ page }) => {
	await expect(page).toHaveScreenshot({
		fullPage: true,
	})
})
