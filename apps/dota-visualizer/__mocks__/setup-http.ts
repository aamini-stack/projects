import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'
import heroStats from './__fixtures__/heroStats.json'

const handlers = [
	http.get('https://api.opendota.com/api/heroStats', () =>
		HttpResponse.json(heroStats),
	),
]

export const server = setupServer(...handlers)

beforeAll(() => {
	server.listen()
})
afterEach(() => {
	server.resetHandlers()
})
afterAll(() => {
	server.close()
})
