import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/')
	await page.routeFromHAR('./__mocks__/hars/search.har', {
		url: '*/**/api/suggestions?q=*',
		update: true,
	})
})

test('Screenshot Homepage', async ({ page }) => {
	const searchBar = page.getByRole('combobox')
	await expect(searchBar).not.toBeDisabled()
	await expect(page).toHaveScreenshot()
})

test('Screenshot Searchbar', async ({ page }) => {
	const searchBar = page.getByRole('combobox', { name: 'Search for TV shows' })
	await expect(searchBar).not.toBeDisabled()
	await searchBar.click()
	await searchBar.fill('Avatar')
	await page.getByTestId('loading-spinner').waitFor({ state: 'hidden' })
	const dropdown = page.getByRole('listbox')
	await expect(dropdown).toBeInViewport()
	await expect(page).toHaveScreenshot()
})

test('Title works', async ({ page }) => {
	await expect(
		page.getByRole('heading', { name: /Welcome to IMDB Graph/i }),
	).toBeVisible()
})

test('Search bar click navigation works', async ({ page }) => {
	const searchBar = page.getByRole('combobox')
	await expect(searchBar).not.toBeDisabled()
	await searchBar.click()
	await searchBar.fill('Avatar')
	await page.getByTestId('loading-spinner').waitFor({ state: 'hidden' })
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
	await page.getByTestId('loading-spinner').waitFor({ state: 'hidden' })
	await expect(
		page.getByText('Avatar: The Last Airbender 2005 - 2008'),
	).toBeVisible()
	await searchBar.press('ArrowDown')
	await searchBar.press('Enter')
	await expect(page).toHaveURL(/.*\/ratings\/tt0417299/)
})

test('LinkedIn button works', async ({ page }) => {
	await expect(page.getByRole('link', { name: 'Aria' })).toHaveAttribute(
		'href',
		'https://www.linkedin.com/in/aria-amini/',
	)
})
