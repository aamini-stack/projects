import * as schema from '@/db/schema'
import { createServerOnlyFn } from '@tanstack/react-start'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

export const createDb = createServerOnlyFn(() => {
	const dbPath = process.env.DATABASE_URL?.replace('file:', '') || 'local.db'
	const sqlite = new Database(dbPath)
	return drizzle(sqlite, { schema })
})
