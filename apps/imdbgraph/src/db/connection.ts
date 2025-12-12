import { createServerOnlyFn } from '@tanstack/react-start'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

export const createDb = createServerOnlyFn(() => {
	return drizzle({
		client: new Pool({
			connectionString: process.env.DATABASE_URL,
		}),
	})
})
