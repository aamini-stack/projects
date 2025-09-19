import { CRON_SECRET } from 'astro:env/server'
import { waitUntil } from '@vercel/functions'
import type { APIRoute } from 'astro'
import { db } from 'db/connection'
import { update } from '#/lib/imdb/scraper'

export const GET: APIRoute = ({ request }) => {
	// Check Auth
	const authHeader = request.headers.get('authorization') ?? ''
	if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
		return new Response('Unauthorized request', {
			status: 401,
		})
	}

	waitUntil(
		update(db).catch((e) => {
			console.log(e)
		}),
	)
	return new Response('Update queued', {
		status: 200,
	})
}
