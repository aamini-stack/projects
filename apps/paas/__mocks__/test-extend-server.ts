// oxlint-disable no-empty-pattern
import * as schema from '@/db/schema'
import handlers from '@/mocks/handlers'
import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { setupServer, type SetupServerApi } from 'msw/node'
import path from 'node:path'
import { test as baseTest } from 'vitest'

type Db = BetterSQLite3Database<typeof schema>

interface DbFixture {
	worker: SetupServerApi
	db: Db
	seedFunction: (db: Db) => Promise<void>
}

export const worker = setupServer(...handlers)

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
	// No explicit scope means 'test' scope - fresh for every test
	seedFunction: async ({}, use) => {
		await use(async (_) => {})
	},
	db: async ({ seedFunction }, use) => {
		// Create in-memory SQLite database
		const sqlite = new Database(':memory:')
		const db = drizzle(sqlite, { schema })

		// Enable foreign keys and constraints
		sqlite.pragma('foreign_keys = ON')
		sqlite.pragma('journal_mode = WAL')

		// Run migrations
		migrate(db, {
			migrationsFolder: path.join(import.meta.dirname, '../src/db/migrations'),
		})

		// Seed if provided
		if (seedFunction) {
			await seedFunction(db)
		}

		// Use the database
		await use(db)

		// Cleanup
		sqlite.close()
	},
})

/**
 * Initialize the database with seed data for the current scope (describe or
 * test).
 */
export function initDb(seedFunction: (db: Db) => Promise<void>) {
	test.scoped({
		seedFunction: async ({}, use) => use(seedFunction),
	})
}

export type { Db as Database }
