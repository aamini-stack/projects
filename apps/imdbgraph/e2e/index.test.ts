import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test.beforeEach(async ({ page }) => {
	await page.route('/api/suggestions**', async (route) => {
		const body = await readFile(
			new URL('../__mocks__/data/suggestions.json', import.meta.url),
			'utf8',
		)
		await route.fulfill({
			contentType: 'application/json',
			body,
		})
	})
	await page.goto('/')
})

test('Title works', async ({ page }) => {
	await expect(page.getByRole('heading', { name: /IMDB Graph/i })).toBeVisible()
})

test('Search bar click navigation works', async ({ page }) => {
	const searchBar = page.getByRole('combobox')
	await expect(searchBar).not.toBeDisabled()
	await searchBar.click()
	await searchBar.fill('Avatar')
	const avatarDropdownOption = page.getByText(
		'Avatar: The Last Airbender 2005 - 2008',
	)
	await expect(avatarDropdownOption).toBeVisible()
	await avatarDropdownOption.click()
	await expect(page).toHaveURL(/.*\/ratings\/tt0417299/)
})

test('Search bar keyboard navigation works', async ({ page }) => {
	const searchBar = page.getByRole('combobox')
	await expect(searchBar).not.toBeDisabled()
	await searchBar.click()
	await searchBar.fill('Avatar')
	await expect(
		page.getByText('Avatar: The Last Airbender 2005 - 2008'),
	).toBeVisible()
	await searchBar.press('Enter')
	await expect(page).toHaveURL(/.*\/ratings\/tt0417299/)
})

test('LinkedIn button works', async ({ page }) => {
	await expect(page.getByRole('link', { name: 'Aria' })).toHaveAttribute(
		'href',
		'https://www.linkedin.com/in/aria-amini/',
	)
})
