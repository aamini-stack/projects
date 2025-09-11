import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/')
})

test('Screenshot Homepage', async ({ page }) => {
	const searchBar = page.getByRole('textbox')
	await expect(searchBar).not.toBeDisabled()
	await expect(page).toHaveScreenshot()
})

test('Title works', async ({ page }) => {
	await expect(
		page.getByRole('heading', { name: /Welcome to IMDB Graph/i }),
	).toBeVisible()
})

test('LinkedIn button works', async ({ page }) => {
	await expect(page.getByRole('link', { name: 'Aria' })).toHaveAttribute(
		'href',
		'https://www.linkedin.com/in/aria-amini/',
	)
})
