import { update } from '#/lib/imdb/scraper.ts'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
	console.error('DATABASE_URL is not defined in .env.local')
	process.exit(1)
}

const db = drizzle({
	client: new Pool({
		connectionString: DATABASE_URL,
	}),
})

async function populateDb() {
	console.log('Starting DB population...')

	try {
		await update(db)
		console.log('DB population completed successfully.')
	} catch (e) {
		console.error('DB population failed:', e)
		process.exit(1)
	}

	process.exit(0)
}

await populateDb()
