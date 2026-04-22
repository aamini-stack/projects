import { ENV } from 'varlock/env'

import { createServerOnlyFn } from '@tanstack/react-start'

export const getCronSecret = createServerOnlyFn(() => {
	return requireEnv(ENV.CRON_SECRET, 'CRON_SECRET')
})

export const getDatabaseUrl = createServerOnlyFn(() => {
	return requireEnv(ENV.DATABASE_URL, 'DATABASE_URL')
})

export function requireEnv(value: string | undefined, name: string): string {
	if (value === undefined || value === '') {
		throw new Error(`Missing ${name}`)
	}

	return value
}
