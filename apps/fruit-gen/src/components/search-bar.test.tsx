import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { SearchBar } from './search-bar'

test('basic search', async () => {
	render(<SearchBar />)
	expect(await screen.findByRole('textbox')).toBeVisible()
})
