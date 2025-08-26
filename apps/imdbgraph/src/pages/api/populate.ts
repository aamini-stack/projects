import type { APIRoute } from 'astro'
import { db } from '../../../db/connection'
import { update } from '../../lib/imdb/scraper'
import { CRON_SECRET } from 'astro:env/server'

export const GET: APIRoute = async ({ request }) => {
	console.log('Netlify Scheduled Function /api/populate triggered!')

	const secret = request.headers.get('x-netlify-trigger-secret')
	if (CRON_SECRET && secret !== CRON_SECRET) {
		return new Response('Unauthorized', { status: 401 })
	}

	try {
		await update(db)
		return new Response(JSON.stringify({ message: 'Database population completed successfully!' }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	} catch (error: any) {
		console.error('Error during database population:', error)
		return new Response(JSON.stringify({ message: 'Database population failed.', error: error.message }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}
}
