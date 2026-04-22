import { defineConfig } from 'drizzle-kit'
import 'varlock/auto-load'
import { ENV } from 'varlock/env'
import { requireEnv } from './src/env.ts'

export default defineConfig({
	schema: './src/db/tables.ts',
	out: './src/db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: requireEnv(ENV.DATABASE_URL, 'DATABASE_URL'),
	},
})
