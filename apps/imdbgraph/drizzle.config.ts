import { defineConfig } from 'drizzle-kit'
import { loadEnv } from 'vite'

const env = loadEnv('production', '.', '')
if (!env.DATABASE_URL) {
	throw Error('Missing DATABASE_URL')
}

export default defineConfig({
	schema: './src/db/tables.ts',
	out: './src/db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: env.DATABASE_URL,
	},
})
