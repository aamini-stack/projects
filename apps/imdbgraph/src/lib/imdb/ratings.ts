import { episode, show } from 'db/tables'
import { asc, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { Episode, Ratings } from '@/lib/imdb/types'

export async function getRatings(
	db: NodePgDatabase,
	showId: string,
): Promise<Ratings | undefined> {
	const result = await db.select().from(show).where(eq(show.imdbId, showId))
	if (!result.length) {
		return undefined
	}
	const foundShow = result[0]
	if (!foundShow) {
		return undefined
	}

	const episodes = await db
		.select({
			title: episode.title,
			seasonNum: episode.seasonNum,
			episodeNum: episode.episodeNum,
			numVotes: episode.numVotes,
			rating: episode.rating,
		})
		.from(episode)
		.where(eq(episode.showId, showId))
		.orderBy(asc(episode.seasonNum), asc(episode.episodeNum))

	// Group episodes by season and episode number (using string keys)
	const groupedEpisodes: Record<number, Record<number, Episode>> = {}
	for (const episodeInfo of episodes) {
		const { seasonNum, episodeNum } = episodeInfo

		// Create season entry if missing
		groupedEpisodes[seasonNum] ??= {}
		// Add episode to season
		groupedEpisodes[seasonNum][episodeNum] = episodeInfo
	}

	return { show: foundShow, allEpisodeRatings: groupedEpisodes }
}
