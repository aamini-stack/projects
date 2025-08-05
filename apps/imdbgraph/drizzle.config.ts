import { defineConfig } from 'drizzle-kit'

if (!process.env.DATABASE_URL) {
	throw Error('Env $DATABASE_URL is empty.')
}

export default defineConfig({
	out: './src/db/tables/migrations',
	schema: './src/db/tables/schema.ts',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL,
	},
})
