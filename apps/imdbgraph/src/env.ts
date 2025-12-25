import { z } from 'zod'

const serverEnvSchema = z.object({
	DATABASE_URL: z.string().startsWith('postgresql://'),
	CRON_SECRET: z.string(),
	NODE_ENV: z.enum(['development', 'production', 'test']),
})

const clientEnvSchema = z.object({
	VITE_PUBLIC_POSTHOG_KEY: z.string(),
})

export const clientEnv = clientEnvSchema.parse(import.meta.env)
export const serverEnv = serverEnvSchema.parse(process.env)

type ServerEnv = z.infer<typeof serverEnvSchema>

declare global {
	namespace NodeJS {
		interface ProcessEnv extends ServerEnv {}
	}
}
