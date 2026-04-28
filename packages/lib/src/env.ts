import { config } from 'dotenv'
import type { ZodTypeAny, z } from 'zod'

export function createEnv<T extends ZodTypeAny>(schema: T): z.infer<T> {
	const rawEnvironmentName =
		process.env.RAILWAY_ENVIRONMENT_NAME ??
		process.env.NODE_ENV ??
		'development'
	const environmentName = /(?:^|-)pr-\d+$/.test(rawEnvironmentName)
		? 'staging'
		: rawEnvironmentName

	config({
		path: [
			`.env.${environmentName}`,
			'.env',
			`.env.${environmentName}.local`,
			'.env.local',
		],
		quiet: true,
		override: true,
	})

	return schema.parse(process.env)
}
