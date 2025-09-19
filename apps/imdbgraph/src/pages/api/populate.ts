import { update } from '#/lib/imdb/scraper'
import { waitUntil } from '@vercel/functions'
import type { APIRoute } from 'astro'
import { CRON_SECRET } from 'astro:env/server'
import { db } from 'db/connection'

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
