import { expect, test } from './helpers/app'

test.setTimeout(15000)
test.beforeEach(async ({ app }) => {
	await app.gotoHome()
})

test('landing page visual regression', async ({ page }) => {
	await expect(
		page.getByRole('heading', {
			name: /The most expensive decision of your life, made right\./i,
		}),
	).toBeVisible()

	await expect(page).toHaveScreenshot('landing-page-desktop.png', {
		fullPage: true,
	})
})
