import { test } from '@/mocks/test-extend-server'
import { describe, expect } from 'vitest'
import { exchangeCodeForToken, fetchGitHubUser } from './github-oauth'

describe('GitHub OAuth - Token Exchange', () => {
	test('exchanges authorization code for access token', async () => {
		const result = await exchangeCodeForToken(
			'test_code',
			'test_client_id',
			'test_secret',
			'http://localhost:3000/api/oauth/github/callback',
		)

		expect(result).toEqual({
			accessToken: 'test_access_token',
			tokenType: 'bearer',
		})
	})

	test('throws error when token exchange fails', async () => {
		await expect(
			exchangeCodeForToken(
				'invalid_code',
				'test_client_id',
				'test_secret',
				'http://localhost:3000/api/oauth/github/callback',
			),
		).rejects.toThrow()
	})
})

describe('GitHub OAuth - User Profile', () => {
	test('fetches GitHub user profile with access token', async () => {
		const result = await fetchGitHubUser('test_access_token')

		expect(result).toEqual({
			githubId: '123456',
			login: 'testuser',
			name: 'Test User',
			email: 'test@example.com',
			avatarUrl: 'https://avatars.githubusercontent.com/u/123456?v=4',
		})
	})
})
