import { createEnv } from '@aamini/lib/env'
import { z } from 'zod'

export const env = createEnv(
	z.object({
		MAILGUN_API_KEY: z.string().optional(),
		MAILGUN_DOMAIN: z.string().optional(),
	}),
)
