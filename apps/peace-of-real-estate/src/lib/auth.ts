import { getDb } from '@/db/connection'
import { account, session, user, verification } from '@/db/tables'
import { getBetterAuthSecret, getBetterAuthUrl } from '@/env.server'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

function createAuth() {
	return betterAuth({
		appName: 'Peace of Real Estate',
		baseURL: getBetterAuthUrl() ?? {
			allowedHosts: ['127.0.0.1:*', 'localhost:*'],
			protocol: 'auto',
			fallback: 'http://localhost:3000',
		},
		secret: getBetterAuthSecret(),
		database: drizzleAdapter(getDb(), {
			provider: 'pg',
			schema: {
				account,
				session,
				user,
				verification,
			},
		}),
		emailAndPassword: {
			enabled: true,
			autoSignIn: true,
		},
		plugins: [tanstackStartCookies()],
	})
}

let authInstance: ReturnType<typeof createAuth> | undefined

export function getAuth() {
	if (authInstance) {
		return authInstance
	}

	authInstance = createAuth()

	return authInstance
}
