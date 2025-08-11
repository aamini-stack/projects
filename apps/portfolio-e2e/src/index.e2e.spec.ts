import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/')
})

test('Screenshot Entire Page', async ({ page }) => {
	await expect(page).toHaveScreenshot({
		fullPage: true,
	})
})

test('Screenshot Home', async ({ page }) => {
	await expect(page).toHaveScreenshot()
})

test('About Me', async ({ page }) => {
	await page.getByRole('button', { name: 'About Me' }).click()
	await expect(page.getByTitle('Experience')).toBeInViewport()
	await expect(page).toHaveScreenshot()
})
