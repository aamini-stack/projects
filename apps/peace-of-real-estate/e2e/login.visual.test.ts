import { expect, test } from './helpers/app'

test.setTimeout(15000)

test('login page visual regression', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1600 })
	await page.goto('/login', { waitUntil: 'domcontentloaded' })
	await page.getByRole('heading', { name: 'Welcome Back' }).waitFor()
	await page.evaluate(async () => {
		await document.fonts.ready
	})

	await expect(page).toHaveScreenshot('login-page.png', {
		fullPage: true,
	})
})
