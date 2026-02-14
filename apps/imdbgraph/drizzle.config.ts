import { defineConfig } from 'drizzle-kit'
import { loadEnv } from 'vite'

const env = loadEnv('production', '.', '')

export default defineConfig({
	schema: './src/db/tables.ts',
	out: './src/db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: env.DATABASE_URL,
	},
})
