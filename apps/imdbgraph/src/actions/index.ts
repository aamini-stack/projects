import { defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { getRatings } from '@/lib/db/data'

export const server = {
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
