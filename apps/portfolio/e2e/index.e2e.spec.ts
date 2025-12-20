import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/', { waitUntil: 'networkidle' })
})

test.describe('Home', () => {
	test('Intro', async ({ page }) => {
		await expect(page).toHaveScreenshot()
	})

	test('Experience', async ({ page }) => {
		await page.getByRole('button', { name: 'About Me' }).click()
		await expect(page.getByTitle('Experience')).toBeInViewport()
		await expect(page).toHaveScreenshot()
	})

	test('Full Page', async ({ page }) => {
		await expect(page).toHaveScreenshot({
			fullPage: true,
		})
	})
})

test.describe('Contact Card', () => {
	test('Basic', async ({ page }) => {
		await expect(page.getByTestId('contact-card')).toHaveScreenshot()
	})

	test('Error State', async ({ page }) => {
		const contactCard = page.getByTestId('contact-card')
		await contactCard.scrollIntoViewIfNeeded()
		await page.getByRole('button', { name: 'Send Message' }).click()
		await expect(contactCard.getByText('Invalid email address')).toBeVisible()
		await expect(contactCard.getByText('Message is required')).toBeVisible()
		await expect(contactCard).toHaveScreenshot()
	})
})
