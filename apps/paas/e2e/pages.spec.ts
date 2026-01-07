import { expect, test } from '@playwright/test'

test.describe('PaaS App Screenshot Tests', () => {
	test('Home page', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' })
		await expect(
			page.locator('input[placeholder="Search projects..."]'),
		).toBeVisible()
		await expect(page).toHaveScreenshot()
	})

	test('Project detail page', async ({ page }) => {
		await page.goto('/project/1', { waitUntil: 'networkidle' })
		await expect(page.locator('h1:has-text("nexus-dashboard")')).toBeVisible()
		await expect(page).toHaveScreenshot()
	})

	test('Deployments page', async ({ page }) => {
		await page.goto('/deployments', { waitUntil: 'networkidle' })
		await expect(page.locator('h1:has-text("Deployments")')).toBeVisible()
		await expect(page).toHaveScreenshot()
	})

	test('Settings page', async ({ page }) => {
		await page.goto('/settings', { waitUntil: 'networkidle' })
		await expect(page.locator('text=/settings/')).toBeVisible()
		await expect(page).toHaveScreenshot()
	})
})
