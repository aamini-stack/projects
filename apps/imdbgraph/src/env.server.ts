import { createServerOnlyFn } from '@tanstack/react-start'
import { ENV } from 'varlock/env'

export const getCronSecret = createServerOnlyFn(() => {
	return ENV.CRON_SECRET
})

export const getDatabaseUrl = createServerOnlyFn(() => {
	return ENV.DATABASE_URL
})
