import { z } from 'zod'

const schema = z.object({
	MAILGUN_API_KEY: z.string().min(1).optional(),
	MAILGUN_DOMAIN: z.string().min(1).optional(),
})

export const env = schema.parse(process.env)
