import { describe, expect, test } from 'vitest'
import { generateJWT, verifyJWT } from './github-oauth'

describe('JWT Token Generation', () => {
	test('generates JWT token with user data', async () => {
		const token = await generateJWT('user_123', 'test_secret')

		expect(token).toBeDefined()
		expect(typeof token).toBe('string')

		const payload = await verifyJWT(token, 'test_secret')
		expect(payload.userId).toBe('user_123')
	})

	test('generates JWT token with custom expiration', async () => {
		const token = await generateJWT('user_123', 'test_secret', '1h')

		expect(token).toBeDefined()

		const payload = await verifyJWT(token, 'test_secret')
		expect(payload.userId).toBe('user_123')
	})

	test('verifies JWT token', async () => {
		const token = await generateJWT('user_456', 'test_secret')

		const payload = await verifyJWT(token, 'test_secret')

		expect(payload).toBeDefined()
		expect(payload.userId).toBe('user_456')
	})

	test('throws error when JWT verification fails with wrong secret', async () => {
		const token = await generateJWT('user_789', 'test_secret')

		await expect(verifyJWT(token, 'wrong_secret')).rejects.toThrow()
	})
})
