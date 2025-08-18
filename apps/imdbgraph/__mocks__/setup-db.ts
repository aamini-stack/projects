// oxlint-disable no-empty-pattern
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import * as schema from 'db/tables'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { reset } from 'drizzle-seed'
import { Pool } from 'pg'
import { test as baseTest } from 'vitest'

type Database = NodePgDatabase & {
	$client: Pool
}

interface DbFixture {
	db: Database
	seedFunction: (db: Database) => Promise<void>
}

export const test = baseTest.extend<DbFixture>({
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
			await migrate(db, { migrationsFolder: 'db/migrations' })
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
