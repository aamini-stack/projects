import { afterAll, afterEach, beforeAll } from 'vitest'

const handlersPath = '__mocks__/handlers.ts'

try {
	const module = await import(/* @vite-ignore */ handlersPath)
	const handlers = module.handlers || module.default
	const { setupWorker } = await import('msw/browser')

	const worker = setupWorker(...handlers)
	beforeAll(
		async () =>
			await worker.start({ quiet: true, onUnhandledRequest: 'bypass' }),
	)
	afterEach(() => worker.resetHandlers())
	afterAll(() => worker.stop())
} catch {
	// No handlers file, skip MSW setup
}
