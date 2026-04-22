import { getDb } from '@/db/connection'
import { requireEnv } from '@/env'
import { account, session, user, verification } from '@/db/tables'
import { ENV } from 'varlock/env'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

let authInstance: ReturnType<typeof betterAuth> | undefined

export function getAuth() {
	if (!authInstance) {
		authInstance = betterAuth({
			appName: 'Peace of Real Estate',
			baseURL: {
				allowedHosts: ['127.0.0.1:*', 'localhost:*', ENV.BETTER_AUTH_URL],
				protocol: 'auto',
				fallback: 'http://localhost:3000',
			},
			secret: requireEnv('BETTER_AUTH_SECRET'),
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
			socialProviders:
				ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET
					? {
							google: {
								clientId: ENV.GOOGLE_CLIENT_ID,
								clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
							},
						}
					: undefined,
			plugins: [tanstackStartCookies()],
		}) as unknown as ReturnType<typeof betterAuth>
	}

	return authInstance
}
