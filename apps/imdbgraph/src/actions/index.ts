import { ActionError, defineAction } from 'astro:actions'
import { asc, db, desc, Episode, eq, ilike, Show } from 'astro:db'
import { z } from 'astro:schema'
import type { Episode as EpisodeType } from '@/lib/types'

export const server = {
	fetchSuggestions: defineAction({
		input: z.object({
			query: z.string(),
		}),
		handler: async ({ query }) => {
			if (!query) {
				throw new ActionError({
					code: 'UNPROCESSABLE_CONTENT',
				})
			}
			try {
				return await db
					.select()
					.from(Show)
					.where(ilike(Show.title, `${query}%`))
					.orderBy(desc(Show.numVotes))
					.limit(5)
			} catch (e) {
				console.error(e)
				throw new ActionError({
					code: 'UNPROCESSABLE_CONTENT',
				})
			}
		},
	}),

	fetchRatings: defineAction({
		input: z.object({
			showId: z.string(),
		}),
		handler: async ({ showId }) => {
			const result = await db.select().from(Show).where(eq(Show.imdbId, showId))
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
					title: Episode.title,
					seasonNum: Episode.seasonNum,
					episodeNum: Episode.episodeNum,
					numVotes: Episode.numVotes,
					rating: Episode.rating,
				})
				.from(Episode)
				.where(eq(Episode.showId, showId))
				.orderBy(asc(Episode.seasonNum), asc(Episode.episodeNum))

			// Group episodes by season and episode number (using string keys)
			const groupedEpisodes: Record<number, Record<number, EpisodeType>> = {}
			for (const episodeInfo of episodes) {
				const { seasonNum, episodeNum } = episodeInfo

				// Create season entry if missing
				groupedEpisodes[seasonNum] ??= {}
				// Add episode to season
				groupedEpisodes[seasonNum][episodeNum] = episodeInfo
			}

			return { show: foundShow, allEpisodeRatings: groupedEpisodes }
		},
	}),
}
