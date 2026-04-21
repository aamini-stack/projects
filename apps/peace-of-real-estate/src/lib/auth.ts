import { getDb } from '@/db/connection'
import { account, session, user, verification } from '@/db/tables'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { ENV } from 'varlock/env'

export const auth = betterAuth({
	appName: 'Peace of Real Estate',
	baseURL: {
		allowedHosts: ['127.0.0.1:*', 'localhost:*', ENV.BETTER_AUTH_URL],
		protocol: 'auto',
		fallback: 'http://localhost:3000',
	},
	secret: ENV.GOOGLE_CLIENT_SECRET,
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
