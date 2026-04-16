import { RateLimiter } from '@/lib/rate-limiter'
import FormData from 'form-data'
import Mailgun from 'mailgun.js'
import { ENV } from 'varlock/env'

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
		throw new Error('BAD_REQUEST: No IP address provided')
	}

	const result = rateLimiter.consume(ipAddress)
	if (!result.success) {
		throw new Error('TOO_MANY_REQUESTS: Rate limit exceeded')
	}

	try {
		const client = mailgun.client({
			username: 'api',
			key: ENV.MAILGUN_API_KEY,
		})
		await client.messages.create(ENV.MAILGUN_DOMAIN, {
			from: `Portfolio Contact Form <postmaster@${ENV.MAILGUN_DOMAIN}>`,
			to: 'Aria Amini <aamini1024@gmail.com>',
			subject: 'New Contact Form Submission',
			text: message,
			'h:Reply-To': email,
		})
	} catch (error) {
		throw new Error(
			`INTERNAL_SERVER_ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}
