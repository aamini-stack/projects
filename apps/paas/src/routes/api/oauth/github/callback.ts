import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/api/oauth/github/callback')({
	loaderDeps: ({ search }: { search: { code?: string } }) => ({ code: search.code }),
	loader: async ({ deps }) => {
		const { code } = deps

		if (!code) {
			throw new Error('Authorization code not found')
		}

		const clientId = process.env.GITHUB_CLIENT_ID
		const clientSecret = process.env.GITHUB_CLIENT_SECRET
		const jwtSecret = process.env.JWT_SECRET

		if (!clientId || !clientSecret || !jwtSecret) {
			throw new Error('OAuth configuration not complete')
		}

		// Dynamic imports to avoid bundling Node.js modules for client
		const { createDb } = await import('@/db/client')
		const { oauthTokens, users } = await import('@/db/schema')
		const {
			exchangeCodeForToken,
			fetchGitHubUser,
			generateJWT,
		} = await import('@/lib/github-oauth')
		const { setSessionCookie } = await import('@/lib/session')
		const { eq } = await import('drizzle-orm')

		const db = createDb()
		const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/oauth/github/callback`

		const { accessToken } = await exchangeCodeForToken(
			code,
			clientId,
			clientSecret,
			redirectUri,
		)
		const githubUser = await fetchGitHubUser(accessToken)

		let user = await db.query.users.findFirst({
			where: eq(users.githubId, githubUser.githubId),
		})

		if (!user) {
			const [newUser] = await db
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					email: githubUser.email,
					name: githubUser.name,
					avatarUrl: githubUser.avatarUrl,
					githubId: githubUser.githubId,
				})
				.returning()

			user = newUser
		}

		if (!user) {
			throw new Error('Failed to create or retrieve user')
		}

		await db
			.insert(oauthTokens)
			.values({
				id: crypto.randomUUID(),
				userId: user.id,
				provider: 'github',
				accessTokenEncrypted: accessToken,
				providerAccountId: githubUser.githubId,
				providerUsername: githubUser.login,
			})
			.onConflictDoUpdate({
				target: [oauthTokens.userId, oauthTokens.provider],
				set: {
					accessTokenEncrypted: accessToken,
					updatedAt: new Date().toISOString(),
				},
			})

		const jwtToken = await generateJWT(user.id, jwtSecret)

		// Set authentication cookie
		setSessionCookie('auth_token', jwtToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 2592000, // 30 days
		})

		throw redirect({ to: '/' })
	},
})
