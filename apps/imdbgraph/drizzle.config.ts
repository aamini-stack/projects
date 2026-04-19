import { defineConfig } from 'drizzle-kit'
import 'varlock/auto-load'
import { ENV } from 'varlock/env'

if (!ENV.DATABASE_URL) {
	throw Error('Missing DATABASE_URL')
}

export default defineConfig({
	schema: './src/db/tables.ts',
	out: './src/db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: ENV.DATABASE_URL,
	},
})
