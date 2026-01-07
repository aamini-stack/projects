import { getCookie, setCookie } from '@tanstack/react-start/server'

/** Gets a cookie value (type-safe wrapper) */
export async function getSessionCookie(name: string): Promise<string | undefined> {
	return getCookie(name)
}

/** Sets a cookie value (type-safe wrapper) */
export async function setSessionCookie(
	name: string,
	value: string,
	options?: {
		path?: string
		httpOnly?: boolean
		sameSite?: 'strict' | 'lax' | 'none'
		maxAge?: number
	},
): Promise<void> {
	setCookie(name, value, options)
}

/**
 * Gets the current authenticated user ID from session
 *
 * @throws Error if not authenticated or JWT secret not configured
 */
export async function getCurrentUser(): Promise<string> {
	const token = await getSessionCookie('auth_token')
	if (!token) {
		throw new Error('Not authenticated')
	}

	const jwtSecret = process.env.JWT_SECRET
	if (!jwtSecret) {
		throw new Error('JWT secret not configured')
	}

	// Dynamic import to avoid bundling crypto module for client
	const { verifyJWT } = await import('./github-oauth')
	const { userId } = await verifyJWT(token, jwtSecret)
	return userId
}

import { useSession } from '@tanstack/react-start/server'

type SessionData = {
	userId?: string
	email?: string
	role?: string
}

export function useAppSession() {
	return useSession<SessionData>({
		// Session configuration
		name: 'app-session',
		password: process.env.SESSION_SECRET!, // At least 32 characters
		// Optional: customize cookie settings
		cookie: {
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			httpOnly: true,
		},
	})
}
