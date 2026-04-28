import { createDb } from '@/db/connection'
import { env } from '@/env'
import { update } from '@/lib/imdb/scraper'
import { createFileRoute } from '@tanstack/react-router'
import { waitUntil } from '@vercel/functions'

export const Route = createFileRoute('/api/populate')({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const cronSecret = env.CRON_SECRET

				// Check Auth
				const authHeader = request.headers.get('authorization') ?? ''
				if (authHeader !== `Bearer ${cronSecret}`) {
					return new Response('Unauthorized request', {
						status: 401,
					})
				}

				waitUntil(
					update(createDb()).catch((error: unknown) => {
						console.log(error)
					}),
				)
				return new Response('Update queued', {
					status: 200,
				})
			},
		},
	},
})
