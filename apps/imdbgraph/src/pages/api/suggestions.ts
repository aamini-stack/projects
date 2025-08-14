import type { APIRoute } from 'astro'
import { fetchSuggestions } from '@/lib/db/data'

export const prerender = false

export const GET: APIRoute = async ({ params, request }) => {
	const url = new URL(request.url)
	const q = url.searchParams.get('q')

	if (!q) {
    console.error("Empty parameter")
		return new Response(JSON.stringify([]))
	}

	const shows = await fetchSuggestions(q)
	request.headers.set(
		'Cache-Control',
		'max-age=60, s-maxage=86400, stale-while-revalidate=3600',
	)
	return new Response(JSON.stringify(shows))
}
