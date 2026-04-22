import { createAuthClient } from 'better-auth/react'
import { ENV } from 'varlock/env'

const authBaseURL =
	typeof window !== 'undefined' ? window.location.origin : ENV.BETTER_AUTH_URL

export const authClient = createAuthClient({
	baseURL: authBaseURL,
})
