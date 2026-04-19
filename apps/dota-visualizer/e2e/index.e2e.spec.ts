import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test.beforeEach(async ({ page }) => {
	await page.route('https://api.opendota.com/api/heroStats', async (route) => {
		const body = await readFile(
			new URL('../__mocks__/heroStats.json', import.meta.url),
			'utf8',
		)
		await route.fulfill({
			contentType: 'application/json',
			body,
		})
	})
	await page.goto('/?view=armor-table')
})

test('Screenshot Armor Page', async ({ page }) => {
	await expect(page.getByRole('table')).toBeVisible()

	// Verify all Icons loaded
	const allIcons = await page.getByRole('table').getByRole('img').all()
	for (const icon of allIcons) {
		await expect(icon).not.toHaveJSProperty('naturalWidth', 0, {
			timeout: 50_000,
		})
	}

	await expect(page).toHaveScreenshot({
		fullPage: true,
	})
})
