import type { Page } from '@playwright/test'

import { expect, test } from './helpers/app'
import { buildDummyAccount, signUpWithEmail } from './helpers/auth'

test.setTimeout(30000)

async function answerCurrentQuestion(page: Page) {
	const textarea = page.locator('textarea')

	if ((await textarea.count()) > 0) {
		await textarea.fill('Looking for clear guidance and fast execution.')
		return
	}

	const multiSelectHint = page.getByText(
		/Select up to \d+ answers to continue\./,
	)

	if ((await multiSelectHint.count()) > 0) {
		const optionButtons = page.getByRole('button').filter({
			hasNotText: /^(Previous Question|Continue|View Your Matches)$/,
		})

		await optionButtons.nth(0).click()
		await optionButtons.nth(1).click()
		return
	}

	await page
		.getByRole('button')
		.filter({ hasNotText: /^(Previous Question|Continue|View Your Matches)$/ })
		.first()
		.click()
}

test.beforeEach(async ({ app }) => {
	await app.gotoHome()
})

test('consumer can complete match flow', async ({ page }) => {
	const account = buildDummyAccount('Consumer Flow')

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

	for (let index = 0; index < 14; index++) {
		await answerCurrentQuestion(page)

		if (index < 13) {
			await expect(page.getByText(`Question ${index + 2} of 14`)).toBeVisible()
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

	await page.getByRole('link', { name: 'Sign up to see results' }).click()
	await expect(page).toHaveURL(/\/signup/)
	await expect(
		page.getByRole('heading', { name: 'Create your account' }),
	).toBeVisible()

	await signUpWithEmail(page, account)
	await page.goto('/account', { waitUntil: 'domcontentloaded' })

	await expect(page.getByRole('heading', { name: account.name })).toBeVisible()
	await expect(page.getByText(account.email)).toBeVisible()
	await page.getByRole('button', { name: /^Fit/ }).click()
	await expect(
		page.getByRole('button', {
			name: /In what price range are you looking to buy\?.*Under \$400k/,
		}),
	).toBeVisible()
})
