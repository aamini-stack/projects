import { getDb } from '@/db/connection'
import { requireEnv } from '@/env'
import { account, session, user, verification } from '@/db/tables'

import { toAuthBaseURL } from '@/lib/auth-base-url'
import { ENV } from 'varlock/env'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

let authInstance: ReturnType<typeof betterAuth> | undefined

export function getAuth() {
	if (!authInstance) {
		const authBaseURL =
			ENV.APP_ENV === 'production' && ENV.BETTER_AUTH_URL
				? toAuthBaseURL(ENV.BETTER_AUTH_URL)
				: {
						allowedHosts: [
							'127.0.0.1:*',
							'localhost:*',
							'peace-of-real-estate-production.up.railway.app',
							'peace-of-real-estate-*.up.railway.app',
							'peace-of-real-estate-projects-*.up.railway.app',
						],
						protocol: 'auto' as const,
						fallback: 'http://localhost:3000/api/auth',
					}

		authInstance = betterAuth({
			appName: 'Peace of Real Estate',
			baseURL: authBaseURL,
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
