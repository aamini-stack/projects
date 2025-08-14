import { HttpResponse, http } from 'msw'

export const handlers = [
	http.get('/api/suggestions', ({ request }) => {
		const url = new URL(request.url)
		const query = url.searchParams.get('q')

		if (query === 'avatar') {
			return HttpResponse.json([
				{
					id: '1',
					title: 'Avatar: The Last Airbender',
					year: 2005,
					image: '',
					rating: 9.3,
					numVotes: 1000000,
				},
			])
		}

		if (query === 'error') {
			return HttpResponse.error()
		} else {
			return HttpResponse.json([])
		}
	}),
]
