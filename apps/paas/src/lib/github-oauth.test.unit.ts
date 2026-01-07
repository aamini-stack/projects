import { describe, expect, test } from 'vitest'
import { generateGitHubAuthUrl } from './github-oauth'

describe('GitHub OAuth', () => {
	test('generates correct GitHub OAuth authorization URL', () => {
		const expectedUrl = new URL('https://github.com/login/oauth/authorize')
		expectedUrl.searchParams.set('client_id', 'test_client_id')
		expectedUrl.searchParams.set(
			'redirect_uri',
			'http://localhost:3000/api/oauth/github/callback',
		)
		expectedUrl.searchParams.set('scope', 'read:user user:email repo')
		expectedUrl.searchParams.set('state', expect.any(String))

		const actualUrl = generateGitHubAuthUrl(
			'test_client_id',
			'http://localhost:3000/api/oauth/github/callback',
		)

		expect(actualUrl).toBeDefined()
		expect(actualUrl.hostname).toBe('github.com')
		expect(actualUrl.pathname).toBe('/login/oauth/authorize')
		expect(actualUrl.searchParams.get('client_id')).toBe('test_client_id')
		expect(actualUrl.searchParams.get('redirect_uri')).toBe(
			'http://localhost:3000/api/oauth/github/callback',
		)
		expect(actualUrl.searchParams.get('scope')).toBe(
			'read:user user:email repo',
		)
		expect(actualUrl.searchParams.get('state')).toBeTruthy()
	})
})
