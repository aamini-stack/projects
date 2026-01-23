/**
 * MSW (Mock Service Worker) fixtures for Vitest
 *
 * Provides factory functions to create MSW fixtures for both server (Node.js)
 * and browser (Playwright) test environments.
 */

import type { RequestHandler } from 'msw'
import type { SetupWorker } from 'msw/browser'
import type { SetupServerApi } from 'msw/node'

// =============================================================================
// Types
// =============================================================================

export interface MswServerFixture {
	worker: SetupServerApi
}

export interface MswBrowserFixture {
	worker: SetupWorker
}

// Common scope type to match Vitest expectations
type FixtureScope = 'test' | 'worker' | 'file'

// Helper types to ensure correct Vitest fixture inference without widening
type FixtureFn<T, C = any> = (
	context: C,
	use: (value: T) => Promise<void>,
) => Promise<void>
type FixtureTuple<T, C = any> = [
	FixtureFn<T, C>,
	{ scope?: FixtureScope; auto?: boolean },
]

// =============================================================================
// Server Fixture (Node.js environment)
// =============================================================================

/**
 * Creates an MSW server fixture for Node.js test environments.
 *
 * Each worker gets its own MSW server instance. Handlers are reset after each
 * test.
 *
 * @example
 * 	;```typescript
 * 	import { createMswServerFixture } from '@aamini/config-testing/fixtures'
 * 	import handlers from './handlers'
 * 	import { test as baseTest } from 'vitest'
 *
 * 	export const test = baseTest.extend({
 * 	  ...createMswServerFixture(handlers),
 * 	})
 * 	```
 */
export function createMswServerFixture(handlers: RequestHandler[]): {
	_mswServer: FixtureTuple<SetupServerApi>
	worker: FixtureTuple<SetupServerApi, any>
} {
	return {
		_mswServer: [
			async ({}: any, use: (server: SetupServerApi) => Promise<void>) => {
				const { setupServer } = await import('msw/node')
				const server = setupServer(...handlers)
				server.listen({ onUnhandledRequest: 'bypass' })
				await use(server)
				server.close()
			},
			{ scope: 'worker' },
		],
		worker: [
			async (
				{ _mswServer }: any,
				use: (worker: SetupServerApi) => Promise<void>,
			) => {
				await use(_mswServer)
				_mswServer.resetHandlers()
			},
			{ scope: 'test', auto: true },
		],
	}
}

// =============================================================================
// Browser Fixture (Playwright/Browser environment)
// =============================================================================

/**
 * Creates an MSW browser fixture for Vitest browser tests.
 *
 * Each worker gets its own MSW worker instance. Handlers are reset after each
 * test.
 *
 * @example
 * 	;```typescript
 * 	import { createMswBrowserFixture } from '@aamini/config-testing/fixtures'
 * 	import handlers from './handlers'
 * 	import { test as baseTest } from 'vitest'
 *
 * 	export const test = baseTest.extend({
 * 	  ...createMswBrowserFixture(handlers),
 * 	})
 * 	```
 */
export function createMswBrowserFixture(handlers: RequestHandler[]): {
	_mswWorker: FixtureTuple<SetupWorker>
	worker: FixtureTuple<SetupWorker, any>
} {
	return {
		_mswWorker: [
			async ({}: any, use: (worker: SetupWorker) => Promise<void>) => {
				const { setupWorker } = await import('msw/browser')
				const worker = setupWorker(...handlers)
				await worker.start({ quiet: true, onUnhandledRequest: 'bypass' })
				await use(worker)
				worker.stop()
			},
			{ scope: 'worker' },
		],
		worker: [
			async (
				{ _mswWorker }: any,
				use: (worker: SetupWorker) => Promise<void>,
			) => {
				await use(_mswWorker)
				_mswWorker.resetHandlers()
			},
			{ scope: 'test', auto: true },
		],
	}
}
