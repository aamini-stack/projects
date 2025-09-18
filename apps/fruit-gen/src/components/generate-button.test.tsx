import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { GenerateButton } from './generate-button'

test('title', () => {
	const screen = render(<GenerateButton />)
	expect(screen.getByText('Generate')).toBeVisible()
})
