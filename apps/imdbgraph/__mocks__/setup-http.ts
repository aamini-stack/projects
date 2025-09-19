// oxlint-disable no-empty-pattern
import { HttpResponse, http } from 'msw'
import { setupWorker } from 'msw/browser'
import { afterAll, beforeAll } from 'vitest'
import searchData from './hars/data.json'

const handlers = [
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

const worker = setupWorker(...handlers)

beforeAll(() => {
	worker.start()
})

afterAll(() => {
	worker.restoreHandlers()
})
