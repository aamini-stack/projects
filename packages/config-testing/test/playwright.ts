import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'

export async function mockJsonRoute(
	page: Page,
	url: string | RegExp,
	fixtureUrl: URL,
) {
	await page.route(url, async (route) => {
		const body = await readFile(fixtureUrl, 'utf8')

		await route.fulfill({
			contentType: 'application/json',
			body,
		})
	})
}
