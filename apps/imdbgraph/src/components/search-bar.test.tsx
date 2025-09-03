import { QueryClient } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { SearchBar } from './search-bar'

vi.mock(import('@/lib/react-query'), () => ({
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
	render(<SearchBar />)

	const searchBar = await screen.findByRole('combobox')
	await user.type(searchBar, 'avatar')
	expect(await screen.findByTestId('loading-spinner')).toBeVisible()
	expect(
		screen.getByRole('link', {
			name: /avatar: the last airbender 2005 - 2008/i,
		}),
	).toBeVisible()
})

test('no results', async () => {
	const user = userEvent.setup()
	render(<SearchBar />)

	const searchBar = await screen.findByRole('combobox')
	await user.type(searchBar, 'blah')
	expect(await screen.findByTestId('loading-spinner')).toBeVisible()
	expect(await screen.findByText(/No TV Shows Found./i)).toBeVisible()
})

test('error message', async () => {
	const user = userEvent.setup()
	render(<SearchBar />)

	const searchBar = await screen.findByRole('combobox')
	await user.type(searchBar, 'error')
	await waitFor(async () =>
		expect(
			await screen.findByText(/Something went wrong. Please try again./i),
		).toBeVisible(),
	)
})
