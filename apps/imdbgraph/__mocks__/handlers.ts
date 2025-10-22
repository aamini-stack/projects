import suggestions from '#/mocks/data/suggestions.json'
import { http, HttpResponse } from 'msw'

export default [
	http.get('/api/suggestions', () => {
		return HttpResponse.json(suggestions)
	}),
]
