import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { ENV } from 'varlock/env'

const globalDb = globalThis as typeof globalThis & {
	__peaceDbPool?: Pool
	__peaceDb?: ReturnType<typeof drizzle>
}

const pool =
	globalDb.__peaceDbPool ??
	new Pool({
		connectionString: ENV.DATABASE_URL,
	})

const db =
	globalDb.__peaceDb ??
	drizzle({
		client: pool,
	})

if (!globalDb.__peaceDbPool) {
	globalDb.__peaceDbPool = pool
}

if (!globalDb.__peaceDb) {
	globalDb.__peaceDb = db
}

export function getDb() {
	return db
}
