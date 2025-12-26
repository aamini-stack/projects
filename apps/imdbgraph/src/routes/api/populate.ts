import { createDb } from '@/db/connection'
import { serverEnv } from '@/env'
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
					!serverEnv.CRON_SECRET ||
					authHeader !== `Bearer ${serverEnv.CRON_SECRET}`
				) {
					return new Response('Unauthorized request', {
						status: 401,
					})
				}

				waitUntil(
					update(createDb()).catch((e) => {
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
