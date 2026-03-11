import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/', { waitUntil: 'networkidle' })
})

test('Screenshot Ratings After Search Navigation', async ({ page }) => {
	const searchBar = page.getByRole('combobox')
	await expect(searchBar).not.toBeDisabled()

	await searchBar.focus()
	await searchBar.fill('Avatar')
	await page.getByTestId('loading-spinner').waitFor({ state: 'hidden' })
	await expect(
		page.getByText('Avatar: The Last Airbender 2005 - 2008'),
	).toBeVisible()
	await searchBar.press('Enter')
	await expect(
		page.getByRole('heading', { name: 'Avatar: The Last Airbender' }),
	).toBeVisible()
	await expect(page).toHaveScreenshot()
})
