import { expect, test } from '@playwright/test'

test('Ratings page title works', async ({ page }) => {
	await page.goto('/ratings/tt0944947')
	await expect(
		page.getByRole('heading', { name: 'Game of Thrones' }),
	).toBeVisible()
})
