import { expect, test } from '@playwright/test'

test.describe('Contact Me', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/')
		await page.getByTestId('contact-card').scrollIntoViewIfNeeded()
	})

	test('Basic', async ({ page }) => {
		const contactCard = page.getByTestId('contact-card')
		await expect(contactCard).toHaveScreenshot()
	})

	test('Error State', async ({ page }) => {
		const contactCard = page.getByTestId('contact-card')
		await page.getByRole('button', { name: 'Send Message' }).click()
		await expect(contactCard.getByText('Invalid email address')).toBeVisible()
		await expect(contactCard.getByText('Message is required')).toBeVisible()
		await expect(contactCard).toHaveScreenshot()
	})
})
