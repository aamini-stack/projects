import { createServerOnlyFn } from '@tanstack/react-start'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { getDatabaseUrl } from '@/env'

let pool: Pool | undefined

function getPool() {
	pool ??= new Pool({
		connectionString: getDatabaseUrl(),
	})

	return pool
}

export const createDb = createServerOnlyFn(() => {
	return drizzle({
		client: getPool(),
	})
})
