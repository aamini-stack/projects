import { test } from '@/mocks/test-extend-server'
import { describe, expect } from 'vitest'
import { fetchUserRepositories } from './github-repos'

describe('GitHub Repositories', () => {
	test('fetches repositories from GitHub API', async () => {
		const repos = await fetchUserRepositories('test_token')

		expect(repos).toHaveLength(3)
		expect(repos[0]).toMatchObject({
			id: '123456',
			name: 'test-repo',
			fullName: 'owner/test-repo',
			owner: 'owner',
			defaultBranch: 'main',
			description: 'Test repository',
		})
		// Check that new fields are present
		expect(repos[0]).toHaveProperty('url')
		expect(repos[0]).toHaveProperty('isPrivate')
	})

	test('fetches repositories with pagination', async () => {
		const repos = await fetchUserRepositories('test_token', 2)

		// Should fetch page 2
		expect(repos).toBeInstanceOf(Array)
	})
})
