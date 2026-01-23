import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, afterEach, beforeAll } from 'vitest'

const handlersPath = resolve(process.cwd(), '__mocks__/handlers.ts')

if (existsSync(handlersPath)) {
	const module = await import(handlersPath)
	const handlers = module.handlers || module.default
	const { setupServer } = await import('msw/node')

	const server = setupServer(...handlers)
	beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
	afterEach(() => server.resetHandlers())
	afterAll(() => server.close())
}
