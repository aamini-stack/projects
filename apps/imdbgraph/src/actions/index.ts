import { defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { fetchSuggestions, getRatings } from '@/lib/db/data'

export const server = {
	fetchSuggestions: defineAction({
		input: z.object({
			query: z.string(),
		}),
		handler: async ({ query }, { request }) => {
			const response = await fetchSuggestions({ query })
			request.headers.set(
				'Cache-Control',
				's-maxage=82800, stale-while-revalidate=59',
			)
			return response
		},
	}),

	fetchRatings: defineAction({
		input: z.object({
			showId: z.string(),
		}),
		handler: async ({ showId }, { request }) => {
			const response = await getRatings({ showId })
			request.headers.set(
				'Cache-Control',
				's-maxage=82800, stale-while-revalidate=59',
			)
			return response
		},
	}),
}
