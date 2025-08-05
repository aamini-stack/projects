import { server } from './mocks/node.js'
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'

beforeAll(() => {
	server.listen()
})
afterEach(() => {
	server.resetHandlers()
})
afterAll(() => {
	server.close()
})
