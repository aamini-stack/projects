import { actions } from 'astro:actions'
import { QueryClient } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { expect, test, vi } from 'vitest'
import { searchMocks } from './__fixtures__/search'
import { SearchBar } from './search-bar'

vi.mock('astro:actions', () => ({
	actions: {
		fetchSuggestions: vi.fn(),
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
	const user = userEvent.setup()
	vi.mocked(actions.fetchSuggestions).mockResolvedValue({
		data: searchMocks.avatar,
		error: undefined,
	})

	render(<SearchBar />)
	const searchBar = await screen.findByRole('combobox')
	await user.type(searchBar, 'avatar')
	expect(await screen.findByTestId('loading-spinner')).toBeVisible()
	expect(await screen.findByText(/Avatar: The Last Airbender/i)).toBeVisible()
})

test('no results', async () => {
	const user = userEvent.setup()
	vi.mocked(actions.fetchSuggestions).mockResolvedValue({
		data: [],
		error: undefined,
	})

	render(<SearchBar />)
	const searchBar = await screen.findByRole('combobox')
	await user.type(searchBar, 'blah')
	expect(await screen.findByTestId('loading-spinner')).toBeVisible()
	expect(await screen.findByText(/No TV Shows Found./i)).toBeVisible()
})

test('error message', async () => {
	vi.mocked(actions.fetchSuggestions).mockRejectedValue({
		data: undefined,
		error: new Error(),
	})

	render(<SearchBar />)
	const searchBar = await screen.findByRole('combobox')
	userEvent.type(searchBar, 'blah')
	await waitFor(async () =>
		expect(
			await screen.findByText(/Something went wrong. Please try again./i),
		).toBeVisible(),
	)
})
