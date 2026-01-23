// oxlint-disable no-empty-pattern
import * as schema from '@/db/tables'
import handlers from '@/mocks/handlers'
import {
	createPostgresFixture,
	type Database,
} from '@aamini/config-testing/fixtures/database'
import { setupServer, type SetupServerApi } from 'msw/node'
import path from 'node:path'
import { test as baseTest } from 'vitest'

interface DbFixture {
	worker: SetupServerApi
	db: Database
	seedFunction: (db: Database) => Promise<void>
}

export const worker = setupServer(...handlers)

const dbFixture = createPostgresFixture({
	migrationsFolder: path.join(import.meta.dirname, '../src/db/migrations'),
	schema,
	extensions: ['pg_trgm'],
})

export const test = baseTest.extend<DbFixture>({
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
	...dbFixture.fixtures,
})

export function initDb(seedFunction: (db: Database) => Promise<void>) {
	test.scoped({
		seedFunction: [async ({}, use) => use(seedFunction), { scope: 'file' }],
	})
}
