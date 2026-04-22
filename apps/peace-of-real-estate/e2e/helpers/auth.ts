import type { Page } from '@playwright/test'

type SignUpDetails = {
	name: string
	email: string
	password: string
}

export async function signUpWithEmail(page: Page, details: SignUpDetails) {
	const result = await page.evaluate(async (payload) => {
		const response = await fetch('/api/auth/sign-up/email', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify(payload),
		})

		return {
			ok: response.ok,
			status: response.status,
			body: await response.text(),
		}
	}, details)

	if (!result.ok) {
		throw new Error(
			`Signup failed with ${result.status}: ${result.body || 'No response body'}`,
		)
	}
}

export function buildDummyAccount(prefix: string): SignUpDetails {
	const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

	return {
		name: `${prefix} Test`,
		email: `${prefix.toLowerCase().replace(/\s+/g, '-')}-${suffix}@example.com`,
		password: 'DummyPassword123!',
	}
}
