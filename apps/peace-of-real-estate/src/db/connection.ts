import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { ENV } from 'varlock/env'

export function getDb() {
	return drizzle({
		client: new Pool({
			connectionString: ENV.DATABASE_URL,
		}),
	})
}
