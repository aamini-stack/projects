import { createServerOnlyFn } from '@tanstack/react-start'
import { DefaultAzureCredential } from '@azure/identity'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { PoolConfig } from 'pg'
import { Pool } from 'pg'
import { getDatabaseUrl } from '@/env.server'

const entraScope = 'https://ossrdbms-aad.database.windows.net/.default'

const azureCredential = new DefaultAzureCredential()

function usesAzurePasswordlessAuth(url: URL) {
	return url.hostname.endsWith('.database.azure.com')
}

function createPoolConfig() {
	const databaseUrl = getDatabaseUrl()
	const url = new URL(databaseUrl)
	const sslmode = url.searchParams.get('sslmode')
	const ssl =
		sslmode === 'require' ||
		sslmode === 'verify-ca' ||
		sslmode === 'verify-full'
			? { rejectUnauthorized: true }
			: undefined

	const config = {
		connectionString: databaseUrl,
		ssl,
	} satisfies PoolConfig

	if (!usesAzurePasswordlessAuth(url)) {
		return config
	}

	return {
		...config,
		password: async () => {
			const token = await azureCredential.getToken([entraScope])
			if (!token) {
				throw new Error('Failed to acquire Azure PostgreSQL access token')
			}

			return token.token
		},
	} satisfies PoolConfig
}

function createDbInstance() {
	const pool = new Pool(createPoolConfig())

	return drizzle({
		client: pool,
	})
}

let dbInstance: ReturnType<typeof createDbInstance> | undefined

export function getDb() {
	if (dbInstance) {
		return dbInstance
	}

	dbInstance = createDbInstance()

	return dbInstance
}

export const createDb = createServerOnlyFn(async () => {
	return getDb()
})
