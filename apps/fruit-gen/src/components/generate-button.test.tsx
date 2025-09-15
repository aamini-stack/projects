import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { GenerateButton } from './generate-button'

test('title', () => {
	const screen = render(<GenerateButton />)
	expect(screen.getByText('Generate')).toBeVisible()
})
