// oxlint-disable typescript-eslint/triple-slash-reference
/// <reference path="../virtual-modules.d.ts" />
// oxlint-disable no-empty-pattern
import handlers from '@test/handlers'
import { setupServer, SetupServer } from 'msw/node'
import { resolve } from 'node:path'
import { test as baseTest } from 'vitest'
import type { Database } from './database'
import { seedDatabase } from './database'

const DEFAULT_SCHEMA_PATH = 'src/db/tables.ts'
const DEFAULT_MIGRATIONS_PATH = 'src/db/migrations'
const DEFAULT_IMAGE = 'postgres:17'

export interface DbFixture {
	server: SetupServer
	_cleanup: void
	db: Database
	seedFunction: (db: Database) => Promise<void>
}

const mswServer = setupServer(...handlers)

export const test = baseTest.extend<DbFixture>({
	// MSW Server fixture
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

	// Database fixtures
	seedFunction: [async ({}, use) => use(async () => {}), { scope: 'file' }],
	db: [
		async ({ seedFunction }: Pick<DbFixture, 'seedFunction'>, use) => {
			const { PostgreSqlContainer } = await import('@testcontainers/postgresql')
			const { drizzle } = await import('drizzle-orm/node-postgres')
			const { Wait } = await import('testcontainers')
			const { Pool } = await import('pg')

			// Auto-discover schema
			const schemaPath = resolve(process.cwd(), DEFAULT_SCHEMA_PATH)

			// Resolve migrations folder relative to cwd (app root)
			const migrationsFolder = resolve(process.cwd(), DEFAULT_MIGRATIONS_PATH)

			const container = await new PostgreSqlContainer(DEFAULT_IMAGE)
				.withWaitStrategy(Wait.forHealthCheck())
				.start()
			const db = drizzle({
				client: new Pool({ connectionString: container.getConnectionUri() }),
			}) as Database

			try {
				await seedDatabase(db, { schemaPath, migrationsFolder, seedFunction })
				await use(db)
			} finally {
				await db.$client.end()
				await container.stop()
			}
		},
		{ scope: 'file' },
	],
})

export function initDb(seedFunction: (db: Database) => Promise<void>) {
	test.override({
		seedFunction: [async ({}, use) => use(seedFunction), { scope: 'file' }],
	})
}
