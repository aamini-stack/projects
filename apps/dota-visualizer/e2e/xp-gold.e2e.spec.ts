import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/?view=xp-gold')
})

test('Screenshot XP & Gold Page', async ({ page }) => {
	await page.goto('/?view=xp-gold')

	// Wait for all three section headings to be visible
	await expect(page.getByRole('heading', { name: 'Hero Levels' })).toBeVisible()
	await expect(
		page.getByRole('heading', { name: 'Creep Scaling' }),
	).toBeVisible()
	await expect(
		page.getByRole('heading', { name: 'Neutral Creep Gold' }),
	).toBeVisible()

	// Wait for the XP chart to render (Recharts renders SVG)
	const chart = page.locator('.recharts-wrapper')
	await expect(chart).toBeVisible()

	// Wait for XP table rows (should have 30 levels)
	const xpTableRows = page
		.locator('section')
		.filter({ hasText: 'Hero Levels' })
		.getByRole('row')
	await expect(xpTableRows).toHaveCount(31) // 30 data rows + 1 header

	// Wait for neutral creeps table to have rows
	const neutralTableRows = page
		.locator('section')
		.filter({ hasText: 'Neutral Creep Gold' })
		.getByRole('row')
	await expect(neutralTableRows.first()).toBeVisible()

	// Wait for fade-in animations to complete (700ms + 300ms delay = ~1s max)
	await page.waitForTimeout(1200)

	await expect(page).toHaveScreenshot({
		fullPage: true,
	})
})
