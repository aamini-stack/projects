import { ContactCard } from '#/components/contact-me'
import { userEvent } from '@vitest/browser/context'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

vi.mock('astro:actions')

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
