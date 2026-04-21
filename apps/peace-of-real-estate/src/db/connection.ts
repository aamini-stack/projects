import { createServerOnlyFn } from '@tanstack/react-start'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

export const getDb = createServerOnlyFn(async () => {
	const pool = new Pool()
	return drizzle({
		client: pool,
	})
})
