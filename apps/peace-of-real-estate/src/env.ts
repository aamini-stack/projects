import { ENV } from 'varlock/env'

export function requireEnv(name: keyof typeof ENV): string {
	const value = ENV[name]

	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`Missing ${name}`)
	}

	return value
}
