import { sendEmail } from '@/lib/email'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const inputSchema = z.object({
	message: z.string().min(1),
	email: z.string().email(),
})

export const Route = createFileRoute('/api/sendEmail')({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const body = await request.json()
					const { message, email } = inputSchema.parse(body)

					// Extract IP from headers
					const ipAddress =
						request.headers.get('x-forwarded-for') ||
						request.headers.get('x-real-ip') ||
						''

					await sendEmail({ message, email, ipAddress })

					return new Response(JSON.stringify({ success: true }), {
						status: 200,
						headers: { 'Content-Type': 'application/json' },
					})
				} catch {
					return new Response(
						JSON.stringify({ error: 'Failed to send email' }),
						{ status: 500, headers: { 'Content-Type': 'application/json' } },
					)
				}
			},
		},
	},
})
