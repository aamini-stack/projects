import { createServerOnlyFn } from '@tanstack/react-start'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { getDatabaseUrl } from '@/env.server'

const pool = new Pool({
	connectionString: getDatabaseUrl(),
})

export const createDb = createServerOnlyFn(() => {
	return drizzle({
		client: pool,
	})
})
