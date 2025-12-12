import { createDb } from '@/db/connection'
import { update } from '@/lib/imdb/scraper'
import { createFileRoute } from '@tanstack/react-router'
import { waitUntil } from '@vercel/functions'

export const Route = createFileRoute('/api/populate')({
	server: {
		handlers: {
			GET: async ({ request }) => {
				// Check Auth
				const authHeader = request.headers.get('authorization') ?? ''
				if (
					!import.meta.env.CRON_SECRET ||
					authHeader !== `Bearer ${import.meta.env.CRON_SECRET}`
				) {
					return new Response('Unauthorized request', {
						status: 401,
					})
				}

				const db = createDb()
				waitUntil(
					update(db).catch((e) => {
						console.log(e)
					}),
				)
				return new Response('Update queued', {
					status: 200,
				})
			},
		},
	},
})
