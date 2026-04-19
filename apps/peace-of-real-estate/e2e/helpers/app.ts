import { expect, test as base, type Page } from '@playwright/test'

type AppFixture = {
	gotoHome: () => Promise<void>
}

async function gotoHome(page: Page) {
	await page.setViewportSize({ width: 1440, height: 2200 })
	await page.goto('/', { waitUntil: 'domcontentloaded' })
	await page.getByRole('link', { name: 'Peace of Real Estate' }).waitFor()
	await page.evaluate(async () => {
		await document.fonts.ready
	})
}

export const test = base.extend<{ app: AppFixture }>({
	app: async ({ page }, use) => {
		await use({
			gotoHome: () => gotoHome(page),
		})
	},
})

export { expect }
