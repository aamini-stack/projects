// oxlint-disable typescript-eslint/triple-slash-reference
/// <reference path="../virtual-modules.d.ts" />
// oxlint-disable no-empty-pattern
import handlers from '@test/handlers'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { setupServer, type SetupServerApi } from 'msw/node'
import { resolve } from 'node:path'
import type { Pool } from 'pg'
import { test as baseTest } from 'vitest'

// Convention: schema at src/db/tables.ts, migrations at src/db/migrations/
const DEFAULT_SCHEMA_PATH = 'src/db/tables.ts'
const DEFAULT_MIGRATIONS_PATH = 'src/db/migrations'
const DEFAULT_EXTENSIONS = ['pg_trgm']
const DEFAULT_IMAGE = 'postgres:17'

export type Database = NodePgDatabase & {
	$client: Pool
}

export interface DbFixture {
	server: SetupServerApi
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
			const { migrate } = await import('drizzle-orm/node-postgres/migrator')
			const { reset } = await import('drizzle-seed')
			const { Pool } = await import('pg')

			// Auto-discover schema
			const schemaPath = resolve(process.cwd(), DEFAULT_SCHEMA_PATH)
			const schema = await import(/* @vite-ignore */ schemaPath)

			// Resolve migrations folder relative to cwd (app root)
			const migrationsFolder = resolve(process.cwd(), DEFAULT_MIGRATIONS_PATH)

			const container = await new PostgreSqlContainer(DEFAULT_IMAGE).start()
			const db = drizzle({
				client: new Pool({ connectionString: container.getConnectionUri() }),
			}) as Database

			try {
				for (const ext of DEFAULT_EXTENSIONS) {
					await db.execute(`CREATE EXTENSION IF NOT EXISTS "${ext}"`)
				}
				await migrate(db, { migrationsFolder })
				await reset(db, schema)
				if (seedFunction) await seedFunction(db)
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
	test.scoped({
		seedFunction: [async ({}, use) => use(seedFunction), { scope: 'file' }],
	})
}
