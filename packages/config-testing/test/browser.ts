// oxlint-disable typescript-eslint/triple-slash-reference
/// <reference path="../virtual-modules.d.ts" />
// oxlint-disable no-empty-pattern
import handlers from '@test/handlers'
import { setupWorker, type SetupWorker } from 'msw/browser'
import { test as baseTest } from 'vitest'

export interface MswBrowserFixture {
	worker: SetupWorker
	_cleanup: void
}

const client = setupWorker(...handlers)

export const test = baseTest.extend<MswBrowserFixture>({
	worker: [
		async ({}, use) => {
			await client.start({ quiet: true, onUnhandledRequest: 'bypass' })
			await use(client)
			client.stop()
		},
		{ auto: true, scope: 'worker' },
	],
	_cleanup: [
		async ({ worker }, use) => {
			await use()
			worker.resetHandlers()
		},
		{ auto: true },
	],
})
