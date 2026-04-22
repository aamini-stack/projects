import { episode, show } from '@/db/tables'
import { gameOfThronesRatings } from '@/lib/imdb/__fixtures__/game-of-thrones'
import { seedDatabase } from '@aamini/config-testing/test/database'
import { stopPostgresContainer } from '@aamini/config-testing/test/postgres'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function buildEpisodeRows() {
	return Object.entries(gameOfThronesRatings.allEpisodeRatings).flatMap(
		([seasonNum, seasonRatings]) =>
			Object.entries(seasonRatings).map(([episodeNum, data]) => ({
				showId: gameOfThronesRatings.show.imdbId,
				episodeId: `got-${seasonNum}-${episodeNum}`,
				title: data.title,
				seasonNum: Number(seasonNum),
				episodeNum: Number(episodeNum),
				rating: data.rating,
				numVotes: data.numVotes,
			})),
	)
}

export default async function globalSetup() {
	const databaseUrl = process.env.DATABASE_URL
	if (!databaseUrl) {
		throw new Error('DATABASE_URL is not defined')
	}

	const db = drizzle({
		client: new Pool({ connectionString: databaseUrl }),
	})

	try {
		await seedDatabase(db, {
			schemaPath: resolve(appRoot, 'src/db/tables.ts'),
			migrationsFolder: resolve(appRoot, 'src/db/migrations'),
			seedFunction: async (db) => {
				await db.insert(show).values(gameOfThronesRatings.show)
				await db.insert(episode).values(buildEpisodeRows())
			},
		})
		return async () => {
			await stopPostgresContainer()
		}
	} finally {
		await db.$client.end()
	}
}
