export interface GitHubRepo {
	id: string
	name: string
	fullName: string
	owner: string
	defaultBranch: string
	description: string | null
	url: string
	isPrivate: boolean
}

/**
 * Fetch user's GitHub repositories
 * @param accessToken - GitHub OAuth access token
 * @param page - Page number for pagination (default: 1)
 * @returns Array of repositories
 */
export async function fetchUserRepositories(
	accessToken: string,
	page = 1,
): Promise<GitHubRepo[]> {
	const url = new URL('https://api.github.com/user/repos')
	url.searchParams.set('per_page', '100')
	url.searchParams.set('page', String(page))
	url.searchParams.set('type', 'owner')
	url.searchParams.set('sort', 'updated')

	const response = await fetch(url.toString(), {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: 'application/vnd.github.v3+json',
		},
	})

	if (!response.ok) {
		throw new Error(`Failed to fetch repositories from GitHub: ${response.status}`)
	}

	const data: Array<{
		id: number
		name: string
		full_name: string
		owner: { login: string }
		default_branch: string
		description: string | null
		html_url: string
		private: boolean
	}> = await response.json()

	return data.map((repo) => ({
		id: String(repo.id),
		name: repo.name,
		fullName: repo.full_name,
		owner: repo.owner.login,
		defaultBranch: repo.default_branch,
		description: repo.description,
		url: repo.html_url,
		isPrivate: repo.private,
	}))
}

// Keep old function name for backwards compatibility
export const fetchGitHubRepos = fetchUserRepositories
