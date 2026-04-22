import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { Pool } from 'pg'

// Convention: schema at src/db/tables.ts, migrations at src/db/migrations/
const DEFAULT_EXTENSIONS = ['pg_trgm']

export type Database = NodePgDatabase & {
	$client: Pool
}

export interface SeedDatabaseOptions {
	schemaPath: string
	migrationsFolder: string
	seedFunction?: (db: Database) => Promise<void>
	extensions?: string[]
}

export async function seedDatabase(
	db: Database,
	{
		schemaPath,
		migrationsFolder,
		seedFunction,
		extensions = DEFAULT_EXTENSIONS,
	}: SeedDatabaseOptions,
) {
	const { migrate } = await import('drizzle-orm/node-postgres/migrator')
	const { reset } = await import('drizzle-seed')

	const schema = await import(/* @vite-ignore */ schemaPath)

	for (const ext of extensions) {
		await db.execute(`CREATE EXTENSION IF NOT EXISTS "${ext}"`)
	}
	await migrate(db, { migrationsFolder })
	await reset(db, schema)
	if (seedFunction) await seedFunction(db)
}
