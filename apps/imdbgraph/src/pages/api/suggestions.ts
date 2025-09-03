import type { APIRoute } from 'astro'
import { db } from 'db/connection'
import { fetchSuggestions } from '@/lib/imdb/search'

export const GET: APIRoute = async ({ request }) => {
	const url = new URL(request.url)
	const q = url.searchParams.get('q')

	if (!q) {
		console.error('Empty parameter')
		return new Response(JSON.stringify([]))
	}

	const shows = await fetchSuggestions(db, q)
	return new Response(JSON.stringify(shows), {
		headers: {
			'Cache-Control':
				'public, max-age=60, s-maxage=86400, stale-while-revalidate=3600',
		},
	})
}
