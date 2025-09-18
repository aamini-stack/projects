// oxlint-disable no-empty-pattern
import { HttpResponse, http } from 'msw'
import { setupWorker } from 'msw/browser'
import { test as testBase } from 'vitest'
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

export const test = testBase.extend({
	worker: [
		async ({}, use) => {
			// Start the worker before the test.
			await worker.start()

			// Expose the worker object on the test's context.
			await use(worker)

			// Remove any request handlers added in individual test cases.
			// This prevents them from affecting unrelated tests.
			worker.resetHandlers()
		},
		{
			auto: true,
		},
	],
})
