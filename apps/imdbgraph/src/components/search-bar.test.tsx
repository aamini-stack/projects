import { QueryClient } from '@tanstack/react-query'
import { userEvent } from '@vitest/browser/context'
import { describe, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { SearchBar } from './search-bar'
import { test } from '#/mocks/test-extend-browser'
import { http, HttpResponse } from 'msw'

vi.mock(import('#/lib/react-query'), () => ({
	queryClient: new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	}),
}))

describe('searchbar tests', () => {
	test('basic search', async () => {
		const screen = render(<SearchBar />)

		const searchBar = screen.getByRole('combobox')
		await userEvent.fill(searchBar, 'avatar')
		await expect
			.element(
				screen.getByRole('link', {
					name: /avatar: the last airbender 2005 - 2008/i,
				}),
			)
			.toBeVisible()
	})

	test('no results', async ({ worker }) => {
		worker.use(
			http.get('/api/suggestions', () => {
				return HttpResponse.json([])
			}),
		)

		const screen = render(<SearchBar />)
		const searchBar = screen.getByRole('combobox')
		await userEvent.fill(searchBar, 'blah')
		await expect.element(screen.getByText(/No TV Shows Found./i)).toBeVisible()
	})

	test('error message', async ({ worker }) => {
		worker.use(
			http.get('/api/suggestions', () => {
				return HttpResponse.error()
			}),
		)

		const screen = render(<SearchBar />)
		const searchBar = screen.getByRole('combobox')
		await userEvent.fill(searchBar, 'error')
		await expect
			.element(screen.getByText(/Something went wrong. Please try again./i))
			.toBeVisible()
	})
})
