import type { Page } from '@playwright/test'

import { expect, test } from './helpers/app'
import { buildDummyAccount, signUpWithEmail } from './helpers/auth'

test.setTimeout(30000)

async function answerCurrentQuestion(page: Page) {
	const textarea = page.locator('textarea')

	if ((await textarea.count()) > 0) {
		await textarea.fill(
			'Clients wanting low communication and minimal collaboration.',
		)
		return
	}

	const multiSelectHint = page.getByText(
		/Select up to \d+ answers to continue\./,
	)

	if ((await multiSelectHint.count()) > 0) {
		const optionButtons = page.getByRole('button').filter({
			hasNotText: /^(Previous Question|Continue|Continue to Profile)$/,
		})

		await optionButtons.nth(0).click()
		await optionButtons.nth(1).click()
		return
	}

	await page
		.getByRole('button')
		.filter({
			hasNotText: /^(Previous Question|Continue|Continue to Profile)$/,
		})
		.first()
		.click()
}

test.beforeEach(async ({ app }) => {
	await app.gotoHome()
})

test('agent can complete onboarding flow', async ({ page }) => {
	const account = buildDummyAccount('Agent Flow')

	await page.getByRole('link', { name: "I'm an Agent" }).click()
	await expect(page).toHaveURL(/\/agent$/)
	await expect(
		page.getByRole('heading', { name: 'Agent Onboarding' }),
	).toBeVisible()

	await page.locator('input[type="range"]').nth(1).press('ArrowRight')
	await page.getByRole('link', { name: 'Continue to Questions' }).click()

	await expect(page).toHaveURL(/\/agent\/quiz$/)
	await expect(
		page.getByRole('heading', { name: 'Core Questions' }),
	).toBeVisible()

	for (let index = 0; index < 12; index++) {
		await answerCurrentQuestion(page)

		if (index < 11) {
			await expect(page.getByText(`Question ${index + 2} of 12`)).toBeVisible()
		}
	}

	await page.getByRole('link', { name: 'Continue to Profile' }).click()

	await expect(page).toHaveURL(/\/agent\/profile$/)
	await expect(
		page.getByRole('heading', { name: 'Create Your Profile' }),
	).toBeVisible()

	await page.locator('select').selectOption('6-10')
	await page
		.getByPlaceholder('e.g. 78701, 78702, 78703')
		.fill('78701, 78702, 78704')
	await page.getByRole('button', { name: 'Buyer Representation' }).click()
	await page.getByRole('button', { name: 'Luxury Homes' }).click()
	await page.getByRole('button', { name: 'Relocation' }).click()
	await page.getByRole('link', { name: 'View Match Demo' }).click()

	await expect(page).toHaveURL(/\/match-activity$/)
	await expect(
		page.getByRole('heading', { name: 'Match Activity' }),
	).toBeVisible()
	// The match activity page shows real seeded agents from the database
	// Just verify the page loads with matches
	await expect(page.getByText('Total Matches')).toBeVisible()

	await page.getByRole('link', { name: 'Sign in' }).click()
	await expect(page).toHaveURL(/\/login/)
	await page.getByRole('link', { name: 'Sign up' }).click()
	await expect(page).toHaveURL(/\/signup/)
	await expect(
		page.getByRole('heading', { name: 'Create your account' }),
	).toBeVisible()

	await signUpWithEmail(page, account)
	await page.goto('/account', { waitUntil: 'domcontentloaded' })

	await expect(page.getByRole('heading', { name: account.name })).toBeVisible()
	await expect(page.getByText(account.email)).toBeVisible()
	await expect(page.getByText('agent', { exact: true })).toBeVisible()
	await expect(page.getByText('6-10')).toBeVisible()
	await expect(page.getByText('78701, 78702, 78704')).toBeVisible()
	await expect(page.getByText('Buyer Representation')).toBeVisible()
	await expect(page.getByText('Luxury Homes')).toBeVisible()
	await expect(page.getByText('Relocation')).toBeVisible()
})
