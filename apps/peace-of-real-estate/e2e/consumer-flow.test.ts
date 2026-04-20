import type { Page } from '@playwright/test'

import { expect, test } from './helpers/app'

test.setTimeout(30000)

async function answerCurrentQuestion(page: Page) {
	const textarea = page.locator('textarea')

	if ((await textarea.count()) > 0) {
		await textarea.fill('Looking for clear guidance and fast execution.')
		return
	}

	await page
		.getByRole('button')
		.filter({ hasNotText: /^(Previous|Next)$/ })
		.first()
		.click()
}

test.beforeEach(async ({ app }) => {
	await app.gotoHome()
})

test('consumer can complete match flow', async ({ page }) => {
	await page.getByRole('link', { name: 'Find Your Agent' }).click()
	await expect(page).toHaveURL(/\/consumer$/)
	await expect(
		page.getByRole('heading', { name: 'Set Your Priorities' }),
	).toBeVisible()

	await page.locator('input[type="range"]').first().press('ArrowRight')
	await page.getByRole('link', { name: 'Continue to Questions' }).click()

	await expect(page).toHaveURL(/\/consumer\/quiz$/)
	await expect(
		page.getByRole('heading', { name: 'Core Questions' }),
	).toBeVisible()
	await expect(page).toHaveScreenshot('consumer-flow-questionnaire.png', {
		fullPage: true,
	})

	for (let index = 0; index < 14; index++) {
		await answerCurrentQuestion(page)

		if (index < 13) {
			await page.getByRole('button', { name: 'Next Question' }).click()
		}
	}

	await page.getByRole('link', { name: 'View Your Matches' }).click()

	await expect(page).toHaveURL(/\/consumer\/results$/)
	await expect(
		page.getByRole('heading', { name: 'Your top agents are ready' }),
	).toBeVisible()
	await expect(page.getByText('Locked until signup')).toBeVisible()
	await expect(
		page.getByRole('link', { name: 'Sign up to see results' }),
	).toBeVisible()
	await expect(page).toHaveScreenshot('consumer-flow-results.png', {
		fullPage: true,
	})
})
