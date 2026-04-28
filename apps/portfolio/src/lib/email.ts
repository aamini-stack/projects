import { RateLimiter } from '@/lib/rate-limiter'
import FormData from 'form-data'
import Mailgun from 'mailgun.js'
import { env } from '@/env'

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

	const mailgunApiKey = env.MAILGUN_API_KEY
	const mailgunDomain = env.MAILGUN_DOMAIN
	if (!mailgunApiKey || !mailgunDomain) {
		throw new Error('INTERNAL_SERVER_ERROR: Email service is not configured')
	}

	try {
		const client = mailgun.client({
			username: 'api',
			key: mailgunApiKey,
		})
		await client.messages.create(mailgunDomain, {
			from: `Portfolio Contact Form <postmaster@${mailgunDomain}>`,
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
