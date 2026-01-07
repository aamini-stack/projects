import { expect, test } from '@playwright/test'

test.describe('Auth Screenshot Tests', () => {
	test('Login page - desktop', async ({ page, context }) => {
		await context.route('/api/oauth/github/authorize', async (route) => {
			await page.waitForURL('/', { timeout: 3000 })
			await route.continue()
		})

		await page.goto('/login', { waitUntil: 'networkidle' })
		await expect(page.locator('text=Login with GitHub')).toBeVisible()
		await expect(page).toHaveScreenshot()
	})

	test('Login page - mobile', async ({ page, context }) => {
		await page.setViewportSize({ width: 375, height: 667 })

		await context.route('/api/oauth/github/authorize', async (route) => {
			await page.waitForURL('/', { timeout: 3000 })
			await route.continue()
		})

		await page.goto('/login', { waitUntil: 'networkidle' })
		await expect(page.locator('text=Login with GitHub')).toBeVisible()
		await expect(page).toHaveScreenshot()
	})

	test('GitHub login button redirects correctly', async ({ page, context }) => {
		let authCalled = false

		await context.route('/api/oauth/github/authorize*', async (route) => {
			authCalled = true
			await route.continue()
		})

		await page.goto('/login')
		await page.click('text=Login with GitHub')

		expect(authCalled).toBe(true)
	})
})
