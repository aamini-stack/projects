import { createDb } from '@/db/connection'
import { getRatings } from '@/lib/imdb/ratings'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/ratings')({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url)
				const showId = url.searchParams.get('id')

				if (!showId) {
					return new Response('Missing id', { status: 400 })
				}

				const ratings = await getRatings(createDb(), showId)
				if (!ratings) {
					return new Response('Not found', { status: 404 })
				}

				return Response.json(ratings, {
					headers: {
						'Cache-Control': 'public, max-age=0, must-revalidate',
					},
				})
			},
		},
	},
})
