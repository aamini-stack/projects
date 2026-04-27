import { z } from 'zod'

const schema = z.object({
	DATABASE_URL: z.string().min(1).optional(),
	BETA_PASSWORD: z.string().min(1).optional(),
	BETTER_AUTH_URL: z.string().min(1),
	BETTER_AUTH_SECRET: z.string().min(1).optional(),
	OAUTH_PROXY_SECRET: z.string().min(1).optional(),
	GOOGLE_CLIENT_ID: z.string().min(1).optional(),
	GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
	AWS_REGION: z.string().min(1),
	AVATAR_BUCKET: z.string().min(1).optional(),
	AWS_ENDPOINT_URL: z.string().min(1),
	AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
	AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
})

export const env = schema.parse(process.env)
