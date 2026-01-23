/**
 * Database fixtures for Vitest using Testcontainers
 *
 * Provides factory functions to create database fixtures with automatic
 * container lifecycle management, migrations, and seeding.
 */

import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { Pool } from 'pg'

// =============================================================================
// Types
// =============================================================================

export type Database = NodePgDatabase & {
	$client: Pool
}

export interface PostgresFixtureOptions<
	TSchema extends Record<string, unknown>,
> {
	/**
	 * PostgreSQL Docker image to use.
	 *
	 * @default 'postgres:17'
	 */
	image?: string

	/**
	 * Path to Drizzle migrations folder. Should be an absolute path or relative
	 * to the test file.
	 */
	migrationsFolder: string

	/** Drizzle schema object for reset/seed operations. */
	schema: TSchema

	/**
	 * PostgreSQL extensions to create before migrations.
	 *
	 * @example
	 * 	{undefined} ;('pg_trgm', 'uuid-ossp')
	 */
	extensions?: string[]

	/** Hook called after container starts but before migrations. */
	beforeMigrate?: (db: Database) => Promise<void>

	/** Hook called after migrations but before seeding. */
	afterMigrate?: (db: Database) => Promise<void>
}

type FixtureScope = 'test' | 'worker' | 'file'

interface FixtureConfig {
	scope?: FixtureScope
}

export interface DatabaseFixture {
	db: Database
	seedFunction: (db: Database) => Promise<void>
}

// Type for the seed function
type SeedFunction = (db: Database) => Promise<void>

// Helper types to ensure correct Vitest fixture inference
type FixtureFn<T, C = any> = (
	context: C,
	use: (value: T) => Promise<void>,
) => Promise<void>
type FixtureTuple<T, C = any> = [FixtureFn<T, C>, { scope?: FixtureScope }]

// =============================================================================
// PostgreSQL Fixture
// =============================================================================

/**
 * Creates a PostgreSQL database fixture using Testcontainers.
 *
 * Each test file gets its own container instance (scope: 'file' by default).
 * The fixture handles:
 *
 * - Starting a PostgreSQL container
 * - Creating specified extensions
 * - Running Drizzle migrations
 * - Resetting and seeding the database
 * - Cleanup on test completion
 *
 * @example
 * 	;```typescript
 * 	import { createPostgresFixture } from '@aamini/config-testing/fixtures/database'
 * 	import * as schema from '@/db/tables'
 * 	import { test as baseTest } from 'vitest'
 * 	import path from 'node:path'
 *
 * 	const dbFixture = createPostgresFixture({
 * 	  migrationsFolder: path.join(import.meta.dirname, '../src/db/migrations'),
 * 	  schema,
 * 	  extensions: ['pg_trgm'],
 * 	})
 *
 * 	export const test = baseTest.extend({
 * 	  ...dbFixture.fixtures,
 * 	})
 *
 * 	// Optional: seed database for specific tests
 * 	export const { initDb } = dbFixture
 * 	```
 */
export function createPostgresFixture<TSchema extends Record<string, unknown>>(
	options: PostgresFixtureOptions<TSchema>,
	config: FixtureConfig = {},
) {
	const {
		image = 'postgres:17',
		migrationsFolder,
		schema,
		extensions = [],
		beforeMigrate,
		afterMigrate,
	} = options
	const { scope = 'file' } = config

	const fixtures: {
		seedFunction: FixtureTuple<SeedFunction>
		db: FixtureTuple<Database, any>
	} = {
		seedFunction: [
			async ({}: any, use: (fn: SeedFunction) => Promise<void>) => {
				await use(async () => {})
			},
			{ scope },
		],
		db: [
			async ({ seedFunction }: any, use: (db: Database) => Promise<void>) => {
				const { PostgreSqlContainer } =
					await import('@testcontainers/postgresql')
				const { drizzle } = await import('drizzle-orm/node-postgres')
				const { migrate } = await import('drizzle-orm/node-postgres/migrator')
				const { reset } = await import('drizzle-seed')
				const { Pool } = await import('pg')

				const container = await new PostgreSqlContainer(image).start()
				const db = drizzle({
					client: new Pool({ connectionString: container.getConnectionUri() }),
				}) as Database

				try {
					for (const ext of extensions) {
						await db.execute(`CREATE EXTENSION IF NOT EXISTS ${ext}`)
					}
					if (beforeMigrate) await beforeMigrate(db)
					await migrate(db, { migrationsFolder })
					if (afterMigrate) await afterMigrate(db)
					await reset(db, schema)
					if (seedFunction) await seedFunction(db)
					await use(db)
				} finally {
					await db.$client.end()
					await container.stop()
				}
			},
			{ scope },
		],
	}

	function initDb(seedFn: SeedFunction): {
		seedFunction: FixtureTuple<SeedFunction>
	} {
		return {
			seedFunction: [
				async ({}: any, use: (fn: SeedFunction) => Promise<void>) => {
					await use(seedFn)
				},
				{ scope },
			],
		}
	}

	return {
		fixtures,
		initDb,
	}
}
