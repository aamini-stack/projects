import { ContactCard } from '@/components/contact-me'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('ContactCard', () => {
	it('should render the contact card', () => {
		render(<ContactCard />)
		expect(screen.getByText('Reach out!')).toBeInTheDocument()
	})

	it('should show an error message when submitting without an email', async () => {
		render(<ContactCard />)
		const submitButton = screen.getByRole('button', { name: /send message/i })
		fireEvent.click(submitButton)
		expect(
			await screen.findByText(/Invalid email address/i),
		).toBeInTheDocument()
	})
})
