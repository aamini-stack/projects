import { createServerFn } from '@tanstack/react-start'

export const getGitHubAuthUrl = createServerFn({ method: 'GET' }).handler(
	async () => {
		const clientId = process.env.GITHUB_CLIENT_ID
		if (!clientId) {
			throw new Error('GITHUB_CLIENT_ID not configured')
		}

		// Dynamic import to avoid bundling crypto module for client
		const { generateGitHubAuthUrl } = await import('@/lib/github-oauth')
		const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/oauth/github/callback`
		const authUrl = generateGitHubAuthUrl(clientId, redirectUri)

		return { url: authUrl.toString() }
	},
)
