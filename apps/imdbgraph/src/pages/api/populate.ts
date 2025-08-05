import { CRON_SECRET } from 'astro:env/server'
import type { APIRoute } from 'astro'
import { update } from '@/lib/db/scraper'

export const prerender = false

export const POST: APIRoute = ({ request }) => {
	// Check Auth
	const authHeader = request.headers.get('authorization') ?? ''
	if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
		return new Response('Unauthorized request', {
			status: 401,
		})
	}

	update().catch((e: unknown) => {
		console.error(e)
	})
	return new Response('Update queued', {
		status: 200,
	})
}
