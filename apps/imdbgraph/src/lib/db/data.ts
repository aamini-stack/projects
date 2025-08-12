import { ActionError } from 'astro:actions'
import { asc, desc, eq, ilike } from 'drizzle-orm'
import { db } from '@/lib/db/connection'
import { episode, show } from '@/lib/db/tables/schema'
import type { Episode, Ratings } from '@/lib/types'

export async function fetchSuggestions({ query }: { query: string }) {
	if (!query) {
		throw new ActionError({
			code: 'UNPROCESSABLE_CONTENT',
		})
	}

	return await db
		.select()
		.from(show)
		.where(ilike(show.title, `%${query}%`))
		.orderBy(desc(show.numVotes))
		.limit(5)
}

export async function getRatings({
	showId,
}: {
	showId: string
}): Promise<Ratings> {
	const result = await db.select().from(show).where(eq(show.imdbId, showId))
	if (!result.length) {
		throw new ActionError({
			code: 'NOT_FOUND',
		})
	}
	const foundShow = result[0]
	if (!foundShow) {
		throw new ActionError({
			code: 'BAD_REQUEST',
		})
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
