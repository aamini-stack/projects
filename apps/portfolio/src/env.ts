import { config } from 'dotenv'
import { z } from 'zod'

const environmentName = process.env.RAILWAY_ENVIRONMENT_NAME ?? process.env.NODE_ENV ?? 'development'

config({
	path: [`.env.${environmentName}`, '.env'],
	quiet: true,
})

const schema = z.object({
	MAILGUN_API_KEY: z.string().min(1).optional(),
	MAILGUN_DOMAIN: z.string().min(1).optional(),
})

export const env = schema.parse(process.env)
