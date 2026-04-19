function readRequiredEnv(
	name: 'BETTER_AUTH_SECRET' | 'CRON_SECRET' | 'DATABASE_URL',
) {
	const value = process.env[name]
	if (!value) {
		throw new Error(`Missing required server env: ${name}`)
	}

	return value
}

export function getCronSecret() {
	return readRequiredEnv('CRON_SECRET')
}

export function getDatabaseUrl() {
	return readRequiredEnv('DATABASE_URL')
}

export function getBetterAuthSecret() {
	return (
		process.env.BETTER_AUTH_SECRET ??
		'dev-only-better-auth-secret-change-me-1234567890'
	)
}

export function getBetterAuthUrl() {
	return process.env.BETTER_AUTH_URL
}
