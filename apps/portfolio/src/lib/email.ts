import { RateLimiter } from '@/lib/rate-limiter'
import FormData from 'form-data'
import Mailgun from 'mailgun.js'

const rateLimiter = new RateLimiter()
const mailgun = new Mailgun(FormData)

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN

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
	if (!(MAILGUN_DOMAIN && MAILGUN_API_KEY)) {
		throw new Error('INTERNAL_SERVER_ERROR: Missing Mailgun credentials')
	}

	const result = rateLimiter.consume(ipAddress)
	if (!result.success) {
		throw new Error('TOO_MANY_REQUESTS: Rate limit exceeded')
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
		throw new Error(
			`INTERNAL_SERVER_ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}
