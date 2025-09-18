import { QueryClient } from '@tanstack/react-query'
import { userEvent } from '@vitest/browser/context'
import { test } from '__mocks__/text-extend'
import { expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'
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

test('no results', async () => {
	const screen = render(<SearchBar />)

	const searchBar = screen.getByRole('combobox')
	await userEvent.fill(searchBar, 'blah')
	await expect.element(screen.getByText(/No TV Shows Found./i)).toBeVisible()
})

test('error message', async () => {
	const screen = render(<SearchBar />)

	const searchBar = screen.getByRole('combobox')
	await userEvent.fill(searchBar, 'error')
	await expect
		.element(screen.getByText(/Something went wrong. Please try again./i))
		.toBeVisible()
})
