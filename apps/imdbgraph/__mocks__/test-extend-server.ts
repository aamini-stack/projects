import * as schema from '#/db/tables'
import handlers from '#/mocks/handlers'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { reset } from 'drizzle-seed'
import { setupServer, type SetupServerApi } from 'msw/node'
import path from 'node:path'
import { Pool } from 'pg'
import { test as baseTest } from 'vitest'

type Database = NodePgDatabase & {
	$client: Pool
}

interface DbFixture {
	worker: SetupServerApi
	db: Database
	seedFunction: (db: Database) => Promise<void>
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
		},
	],
	seedFunction: [async ({}, use) => use(async (_) => {}), { scope: 'file' }],
	db: [
		async ({ seedFunction }, use) => {
			// Connect
			const container = await new PostgreSqlContainer('postgres:17').start()
			const db = drizzle({
				client: new Pool({ connectionString: container.getConnectionUri() }),
			})

			// Setup
			await db.execute('CREATE EXTENSION pg_trgm')
			await migrate(db, {
				migrationsFolder: path.join(
					import.meta.dirname,
					'../src/db/migrations',
				),
			})
			await reset(db, schema)
			if (seedFunction) {
				await seedFunction(db)
			}

			// Use
			await use(db)

			// Cleanup
			await db.$client.end()
			await container.stop()
		},
		{ scope: 'file' },
	],
})

export function initDb(seedFunction: (db: NodePgDatabase) => Promise<void>) {
	test.scoped({
		seedFunction: [async ({}, use) => use(seedFunction), { scope: 'file' }],
	})
}
