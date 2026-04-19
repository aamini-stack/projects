import { createDb } from '@/db/connection'
import { getCronSecret } from '@/env.server'
import { update } from '@/lib/imdb/scraper'
import { createFileRoute } from '@tanstack/react-router'
import { waitUntil } from '@vercel/functions'

export const Route = createFileRoute('/api/populate')({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const cronSecret = getCronSecret()

				// Check Auth
				const authHeader = request.headers.get('authorization') ?? ''
				if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
					return new Response('Unauthorized request', {
						status: 401,
					})
				}

				waitUntil(
					createDb()
						.then((db) => update(db))
						.catch((e) => {
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
