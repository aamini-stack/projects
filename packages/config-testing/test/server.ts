// oxlint-disable typescript-eslint/triple-slash-reference
/// <reference path="../virtual-modules.d.ts" />
// oxlint-disable no-empty-pattern
import handlers from '@test/handlers'
import { setupServer, type SetupServerApi } from 'msw/node'
import { test as baseTest } from 'vitest'

export interface MswServerFixture {
	server: SetupServerApi
	_cleanup: void
}

const mswServer = setupServer(...handlers)

export const test = baseTest.extend<MswServerFixture>({
	server: [
		async ({}, use) => {
			mswServer.listen({ onUnhandledRequest: 'bypass' })
			await use(mswServer)
			mswServer.close()
		},
		{ auto: true, scope: 'worker' },
	],
	_cleanup: [
		async ({ server }, use) => {
			await use()
			server.resetHandlers()
		},
		{ auto: true },
	],
})
