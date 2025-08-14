import { HttpResponse, http } from 'msw'

export const handlers = [
	http.get('/api/suggestions', ({ request }) => {
		const url = new URL(request.url)
		const query = url.searchParams.get('q')

		if (query === 'avatar') {
			return HttpResponse.json({
				data: [
					{
						id: '1',
						title: 'Avatar: The Last Airbender',
						year: 2005,
						image: '',
						rating: 9.3,
						numVotes: 1000000,
					},
				],
				error: undefined,
			})
		}

		if (query === 'blah') {
			return HttpResponse.json({
				data: [],
				error: undefined,
			})
		}

		return HttpResponse.json(
			{
				data: undefined,
				error: new Error('Something went wrong. Please try again.'),
			},
			{ status: 500 },
		)
	}),
]
