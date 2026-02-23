import { update } from '@/lib/imdb/scraper.ts'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const DATABASE_URL =
	process.env.DATABASE_URL ?? process.env.STAGING_DATABASE_URL

if (!DATABASE_URL) {
	console.error(
		'DATABASE_URL (or STAGING_DATABASE_URL) is not defined in .env.local',
	)
	process.exit(1)
}

const pool = new Pool({
	connectionString: DATABASE_URL,
})

const db = drizzle({ client: pool })

async function printPopulationStats() {
	const [showCountResult, episodeCountResult, lowSignalEpisodeCountResult] =
		await Promise.all([
			pool.query<{ count: string }>('SELECT count(*) FROM show;'),
			pool.query<{ count: string }>('SELECT count(*) FROM episode;'),
			pool.query<{ count: string }>(
				'SELECT count(*) FROM episode WHERE rating <= 1 OR num_votes <= 1;',
			),
		])

	const showCount = Number(showCountResult.rows[0]?.count ?? '0')
	const episodeCount = Number(episodeCountResult.rows[0]?.count ?? '0')
	const lowSignalEpisodeCount = Number(
		lowSignalEpisodeCountResult.rows[0]?.count ?? '0',
	)

	console.log(
		`Population stats: ${showCount.toLocaleString()} shows, ${episodeCount.toLocaleString()} episodes`,
	)

	if (lowSignalEpisodeCount > 0) {
		throw new Error(
			`Regression detected: found ${lowSignalEpisodeCount.toLocaleString()} episodes with rating <= 1 or num_votes <= 1`,
		)
	}
}

async function populateDb(): Promise<number> {
	console.log('Starting DB population...')

	try {
		await update(db)
		await printPopulationStats()
		console.log('DB population completed successfully.')
		return 0
	} catch (e) {
		console.error('DB population failed:', e)
		return 1
	} finally {
		await pool.end()
	}
}

process.exit(await populateDb())
