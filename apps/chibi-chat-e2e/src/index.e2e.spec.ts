import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/')
})

test('Wait for first few messsages', async ({ page }) => {
	await page.goto('http://localhost:4004/')
	const playButton = page
		.locator(
			'iframe[title="Tomba 2 by CavemanDCJ in 1:17:27 - SGDQ2014 - Part 83"]',
		)
		.contentFrame()
		.getByRole('button', { name: 'Play' })
	await expect(playButton).toBeVisible()
	await playButton.click()

	const video = page
		.locator(
			'iframe[title="Tomba 2 by CavemanDCJ in 1:17:27 - SGDQ2014 - Part 83"]',
		)
		.contentFrame()
		.locator('video')
	await video.click()
	await page.keyboard.press('Digit3')
	await video.click()
	await expect(page.getByText('LOOK AT HIS FAAAAAAAAAACE!!!')).toBeVisible({
		timeout: 20_000,
	})
})
