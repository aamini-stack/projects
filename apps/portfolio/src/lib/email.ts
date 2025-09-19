import { ActionError } from 'astro:actions'
import { MAILGUN_API_KEY, MAILGUN_DOMAIN } from 'astro:env/server'
import FormData from 'form-data'
import Mailgun from 'mailgun.js'
import { RateLimiter } from '#/lib/rate-limiter'

const rateLimiter = new RateLimiter()
const mailgun = new Mailgun(FormData)

export async function sendEmail({
	message,
	ipAddress,
	email,
}: {
	message: string
	ipAddress: string
	email: string
}) {
	if (!ipAddress) {
		throw new ActionError({ code: 'BAD_REQUEST' })
	}
	if (!MAILGUN_DOMAIN || !MAILGUN_API_KEY) {
		throw new ActionError({ code: 'INTERNAL_SERVER_ERROR' })
	}

	const result = rateLimiter.consume(ipAddress)
	if (!result.success) {
		throw new ActionError({ code: 'TOO_MANY_REQUESTS' })
	}

	try {
		const client = mailgun.client({
			username: 'api',
			key: MAILGUN_API_KEY,
		})
		await client.messages.create(MAILGUN_DOMAIN, {
			from: `Portfolio Contact Form <postmaster@${MAILGUN_DOMAIN}>`,
			to: 'Aria Amini <aamini1024@gmail.com>',
			subject: 'New Contact Form Submission',
			text: message,
			'h:Reply-To': email,
		})
	} catch (error) {
		throw new ActionError({
			code: 'INTERNAL_SERVER_ERROR',
			message: error instanceof Error ? error?.message : '',
			stack: error instanceof Error ? (error?.stack ?? '') : '',
		})
	}
}
