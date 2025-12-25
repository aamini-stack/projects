import { serverEnv } from '@/env'
import { createServerOnlyFn } from '@tanstack/react-start'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const pool = new Pool({
	connectionString: serverEnv.DATABASE_URL,
})

export const createDb = createServerOnlyFn(() => {
	return drizzle({
		client: pool,
	})
})
