import { ActionError } from 'astro:actions'
import { QueryClient } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { searchMocks } from './__fixtures__/search'
import { SearchBar } from './search-bar'

vi.mock('astro:actions', () => ({
	actions: {
		fetchSuggestions: mockFetchSuggestions,
	},
}))

vi.mock(import('@/lib/query'), () => ({
	queryClient: new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	}),
}))

test('basic search', async () => {
	render(<SearchBar />)

	const searchBar = await screen.findByRole('combobox')
	userEvent.type(searchBar, 'a')

	expect(await screen.findByText(/Avatar/i)).toBeInTheDocument()
})

test('loading spinner', async () => {
	render(<SearchBar />)

	const searchBar = await screen.findByRole('combobox')
	fireEvent.change(searchBar, { target: { value: 'blah' } })
	expect(await screen.findByTestId('loading-spinner')).toBeVisible()
})

test('no results', async () => {
	render(<SearchBar />)

	const searchBar = await screen.findByRole('combobox')
	userEvent.type(searchBar, 'blah')
	expect(await screen.findByText(/No TV Shows Found./i)).toBeInTheDocument()
})

test('error message', async () => {
	render(<SearchBar />)

	const searchBar = await screen.findByRole('combobox')
	userEvent.type(searchBar, 'error')

	const errMessage = /Something went wrong. Please try again./i
	expect(await screen.findByText(errMessage)).toBeInTheDocument()
})

function mockFetchSuggestions({ query }: { query: string }) {
	if (query === 'error') {
		return Promise.resolve({
			error: new ActionError({
				code: 'INTERNAL_SERVER_ERROR',
			}),
		})
	} else {
		return Promise.resolve({
			data: searchMocks[query.toLocaleLowerCase()] ?? [],
		})
	}
}
