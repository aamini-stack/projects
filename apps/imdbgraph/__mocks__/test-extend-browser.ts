import handlers from '#/mocks/handlers'
import { setupWorker, type SetupWorker } from 'msw/browser'
import { test as testBase } from 'vitest'

export const client = setupWorker(...handlers)

export const test = testBase.extend<{ worker: SetupWorker }>({
	worker: [
		async ({}, use) => {
			await client.start({ onUnhandledRequest: 'bypass' })
			await use(client)
			client.resetHandlers()
		},
		{
			auto: true,
		},
	],
})
