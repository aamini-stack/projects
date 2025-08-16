import { defineConfig } from 'drizzle-kit'
import { loadEnv } from 'vite'

const url = loadEnv('dev', process.cwd(), '').DATABASE_URL

if (!url) {
	throw Error('Env $DATABASE_URL is empty.')
}

export default defineConfig({
	schema: './db/tables.ts',
	out: './db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: url,
	},
})
