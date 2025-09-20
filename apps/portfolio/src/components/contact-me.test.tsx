import { userEvent } from '@vitest/browser/context'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { ContactCard } from '#/components/contact-me'

test('render card', () => {
	const screen = render(<ContactCard />)
	expect(screen.getByText('Reach out!')).toBeInTheDocument()
})

test('empty email', async () => {
	const screen = render(<ContactCard />)
	const submitButton = screen.getByRole('button', { name: /send message/i })
	await userEvent.click(submitButton)
	expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument()
})
