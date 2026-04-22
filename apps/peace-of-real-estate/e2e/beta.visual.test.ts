import { expect, test } from './helpers/app'

test.setTimeout(15000)

test('beta login page visual regression', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1600 })
	await page.context().clearCookies()
	await page.goto('/beta', { waitUntil: 'domcontentloaded' })
	await page.getByRole('heading', { name: 'Under Construction' }).waitFor()
	await page.evaluate(async () => {
		await document.fonts.ready
	})

	await expect(page).toHaveScreenshot('beta-login-page.png', {
		fullPage: true,
	})
})
