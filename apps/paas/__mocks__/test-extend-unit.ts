import handlers from '@/mocks/handlers'
import { setupServer, type SetupServerApi } from 'msw/node'
import { test as baseTest } from 'vitest'

interface MswFixture {
	worker: SetupServerApi
}

export const worker = setupServer(...handlers)

export const test = baseTest.extend<MswFixture>({
	worker: [
		async ({}, use) => {
			worker.listen({ onUnhandledRequest: 'bypass' })
			await use(worker)
			worker.resetHandlers()
		},
		{
			auto: true,
			scope: 'worker',
		},
	],
})

export type { MswFixture }
