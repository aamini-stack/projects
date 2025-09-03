import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'
import searchData from './hars/data.json'

export const handlers = [
	http.get('/api/suggestions', ({ request }) => {
		const url = new URL(request.url)
		const query = url.searchParams.get('q')

		if (query === 'avatar') {
			return HttpResponse.json(searchData)
		}

		if (query === 'error') {
			return HttpResponse.error()
		} else {
			return HttpResponse.json([])
		}
	}),
]

// Setup
const server = setupServer(...handlers)
beforeAll(() => {
	server.listen({ onUnhandledRequest: 'error' })
})
afterEach(() => {
	server.resetHandlers()
})
afterAll(() => {
	server.close()
})
