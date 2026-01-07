import { fetchUserRepositories } from '@/lib/github-repos'
import { getCurrentUser } from '@/lib/session'
import { createDb } from '@/db/client'
import { oauthTokens } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'

/**
 * Get user's GitHub repositories
 */
export const getRepos = createServerFn({ method: 'GET' })
	.inputValidator((params: { search?: string; page?: number } = {}) => params)
	.handler(async ({ data: { search, page = 1 } }) => {
		const userId = await getCurrentUser()
		const db = createDb()

		// Get user's GitHub OAuth token
		const token = await db.query.oauthTokens.findFirst({
			where: and(
				eq(oauthTokens.userId, userId),
				eq(oauthTokens.provider, 'github'),
			),
		})

		if (!token) {
			throw new Error('GitHub token not found. Please re-authenticate.')
		}

		// Fetch repositories from GitHub API
		const repos = await fetchUserRepositories(
			token.accessTokenEncrypted, // TODO: decrypt in production
			page,
		)

		// Filter by search term if provided
		let filtered = repos
		if (search) {
			const term = search.toLowerCase()
			filtered = repos.filter(
				(repo) =>
					repo.name.toLowerCase().includes(term) ||
					repo.fullName.toLowerCase().includes(term) ||
					repo.description?.toLowerCase().includes(term),
			)
		}

		// Transform to expected format
		return filtered.map((repo) => ({
			id: String(repo.id),
			name: repo.name,
			fullName: repo.fullName,
			owner: repo.owner,
			defaultBranch: repo.defaultBranch,
			description: repo.description || '',
			url: repo.url,
			isPrivate: repo.isPrivate,
		}))
	})
