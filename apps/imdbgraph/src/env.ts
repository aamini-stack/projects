import { config } from 'dotenv'
import { z } from 'zod'

const environmentName = process.env.RAILWAY_ENVIRONMENT_NAME ?? process.env.NODE_ENV ?? 'development'

config({
	path: [`.env.${environmentName}`, '.env'],
	quiet: true,
})

const schema = z.object({
	DATABASE_URL: z.string().min(1),
	CRON_SECRET: z.string().min(1),
})

export const env = schema.parse(process.env)
