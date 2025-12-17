import { createDb } from '@/db/connection'
import { fetchSuggestions } from '@/lib/imdb/search'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/suggestions')({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url)
				const q = url.searchParams.get('q')

				if (!q) {
					console.error('Empty parameter')
					return new Response(JSON.stringify([]))
				}

				const db = createDb()
				const shows = await fetchSuggestions(db, q)
				return new Response(JSON.stringify(shows), {
					headers: {
						'CDN-Cache-Control':
							'public, max-age=60, s-maxage=86400, stale-while-revalidate=3600',
					},
				})
			},
		},
	},
})
