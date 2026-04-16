import { ContactCard } from '@/components/contact-me'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

test('render card', async () => {
	const screen = await render(<ContactCard />)
	await expect.element(screen.getByText('Reach out!')).toBeInTheDocument()
})

test('empty email', async () => {
	const screen = await render(<ContactCard />)
	const submitButton = screen.getByRole('button', { name: /send message/i })
	await userEvent.click(submitButton)
	await expect
		.element(screen.getByText(/Invalid email address/i))
		.toBeInTheDocument()
})
