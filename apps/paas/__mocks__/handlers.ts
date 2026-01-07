import githubAccessToken from '@/mocks/data/github-access-token.json' with { type: 'json' }
import githubRepos from '@/mocks/data/github-repos.json' with { type: 'json' }
import githubUser from '@/mocks/data/github-user.json' with { type: 'json' }
import { http, HttpResponse } from 'msw'

export default [
	http.post(
		'https://github.com/login/oauth/access_token',
		async ({ request }) => {
			const body = await request.json()
			const bodyObj = body as { code: string }
			if (bodyObj.code === 'invalid_code') {
				return HttpResponse.json(
					{
						error: 'bad_verification_code',
						error_description: 'The code passed is incorrect or expired.',
					},
					{ status: 400 },
				)
			}
			return HttpResponse.json(githubAccessToken)
		},
	),

	http.get('https://api.github.com/user', () => {
		return HttpResponse.json(githubUser)
	}),

	http.get('https://api.github.com/user/repos', () => {
		return HttpResponse.json(githubRepos)
	}),
]
