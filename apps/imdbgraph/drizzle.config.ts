import { defineConfig } from 'drizzle-kit'

if (!process.env.DATABASE_URL) {
	throw Error('Env $DATABASE_URL is empty.')
}

export default defineConfig({
	schema: './db/tables.ts',
	out: './db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL,
	},
})
