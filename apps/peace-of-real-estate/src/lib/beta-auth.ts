import { createServerFn } from '@tanstack/react-start'

export const checkBetaAuthServer = createServerFn({ method: 'GET' }).handler(
	async () => {
		const { getCookie } = await import('@tanstack/react-start/server')
		return getCookie('beta_auth') === 'true'
	},
)

export function checkBetaAuthClient(): boolean {
	if (typeof document !== 'undefined') {
		return document.cookie.includes('beta_auth=true')
	}
	return false
}
