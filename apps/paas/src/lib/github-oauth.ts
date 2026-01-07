import { SignJWT, jwtVerify } from 'jose'

function generateRandomState(): string {
	const array = new Uint8Array(16)
	crypto.getRandomValues(array)
	return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
		'',
	)
}

export function generateGitHubAuthUrl(
	clientId: string,
	redirectUri: string,
): URL {
	const url = new URL('https://github.com/login/oauth/authorize')
	url.searchParams.set('client_id', clientId)
	url.searchParams.set('redirect_uri', redirectUri)
	url.searchParams.set('scope', 'read:user user:email repo')
	url.searchParams.set('state', generateRandomState())
	return url
}

export async function exchangeCodeForToken(
	code: string,
	clientId: string,
	clientSecret: string,
	redirectUri: string,
): Promise<{ accessToken: string; tokenType: string }> {
	const response = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			code,
			redirect_uri: redirectUri,
		}),
	})

	if (!response.ok) {
		const error = await response.json()
		throw new Error(`${error.error}: ${error.error_description}`)
	}

	const data = await response.json()
	return {
		accessToken: data.access_token,
		tokenType: data.token_type,
	}
}

export async function fetchGitHubUser(accessToken: string): Promise<{
	githubId: string
	login: string
	name: string
	email: string
	avatarUrl: string
}> {
	const response = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: 'application/json',
		},
	})

	if (!response.ok) {
		throw new Error('Failed to fetch user from GitHub')
	}

	const data = await response.json()

	// If email is not public, fetch from /user/emails endpoint
	let email = data.email
	if (!email) {
		const emailsResponse = await fetch('https://api.github.com/user/emails', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json',
			},
		})

		if (emailsResponse.ok) {
			const emails = await emailsResponse.json()
			// Find the primary email, or the first verified email, or just the first one
			const primaryEmail = emails.find((e: any) => e.primary)
			const verifiedEmail = emails.find((e: any) => e.verified)
			email = primaryEmail?.email || verifiedEmail?.email || emails[0]?.email
		}

		// If still no email, use GitHub's noreply email
		if (!email) {
			email = `${data.login}@users.noreply.github.com`
		}
	}

	return {
		githubId: String(data.id),
		login: data.login,
		name: data.name || data.login, // Use login as fallback for name
		email: email,
		avatarUrl: data.avatar_url,
	}
}

export async function generateJWT(
	userId: string,
	secret: string,
	expiration = '7d',
): Promise<string> {
	const encoder = new TextEncoder()
	const key = encoder.encode(secret)

	const jwt = await new SignJWT({ userId })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(expiration)
		.sign(key)

	return jwt
}

export async function verifyJWT(
	token: string,
	secret: string,
): Promise<{ userId: string }> {
	const encoder = new TextEncoder()
	const key = encoder.encode(secret)

	const { payload } = await jwtVerify(token, key)

	return { userId: String(payload.userId) }
}
