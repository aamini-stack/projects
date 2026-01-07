import { beforeEach, describe, expect, test, vi } from 'vitest'
import { decrypt, encrypt, generateEncryptionKey, isEncryptionConfigured } from './crypto'

describe('Crypto utilities', () => {
	const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

	beforeEach(() => {
		// Set up encryption key for tests
		vi.stubEnv('ENCRYPTION_KEY', testKey)
	})

	test('generateEncryptionKey generates 64-character hex string', () => {
		const key = generateEncryptionKey()
		expect(key).toHaveLength(64)
		expect(key).toMatch(/^[0-9a-f]{64}$/)
	})

	test('encrypts and decrypts a string correctly', async () => {
		const plaintext = 'Hello, World!'
		const encrypted = await encrypt(plaintext)
		const decrypted = await decrypt(encrypted)

		expect(decrypted).toBe(plaintext)
		expect(encrypted).not.toBe(plaintext)
		expect(encrypted).toContain(':') // Should have IV:ciphertext format
	})

	test('encrypts and decrypts OAuth tokens', async () => {
		const token = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz'
		const encrypted = await encrypt(token)
		const decrypted = await decrypt(encrypted)

		expect(decrypted).toBe(token)
	})

	test('encrypts and decrypts environment variables', async () => {
		const envValue = 'postgres://user:password@localhost:5432/db'
		const encrypted = await encrypt(envValue)
		const decrypted = await decrypt(encrypted)

		expect(decrypted).toBe(envValue)
	})

	test('handles empty strings', async () => {
		const encrypted = await encrypt('')
		const decrypted = await decrypt('')

		expect(encrypted).toBe('')
		expect(decrypted).toBe('')
	})

	test('encryption produces different outputs for same input', async () => {
		const plaintext = 'test123'
		const encrypted1 = await encrypt(plaintext)
		const encrypted2 = await encrypt(plaintext)

		// Should be different due to random IV
		expect(encrypted1).not.toBe(encrypted2)

		// But both should decrypt to same value
		expect(await decrypt(encrypted1)).toBe(plaintext)
		expect(await decrypt(encrypted2)).toBe(plaintext)
	})

	test('isEncryptionConfigured returns true when key is set', () => {
		expect(isEncryptionConfigured()).toBe(true)
	})

	test('isEncryptionConfigured returns false when key is not set', () => {
		vi.stubEnv('ENCRYPTION_KEY', undefined)
		expect(isEncryptionConfigured()).toBe(false)
	})

	test('throws error when encryption key is missing', async () => {
		vi.stubEnv('ENCRYPTION_KEY', undefined)
		await expect(encrypt('test')).rejects.toThrow('ENCRYPTION_KEY')
	})

	test('throws error when encryption key has wrong length', async () => {
		vi.stubEnv('ENCRYPTION_KEY', 'short')
		await expect(encrypt('test')).rejects.toThrow('32-byte hex string')
	})

	test('throws error when decrypting invalid format', async () => {
		await expect(decrypt('invalid')).rejects.toThrow('Invalid encrypted value format')
	})

	test('encrypts unicode characters correctly', async () => {
		const plaintext = 'Hello 世界 🌍'
		const encrypted = await encrypt(plaintext)
		const decrypted = await decrypt(encrypted)

		expect(decrypted).toBe(plaintext)
	})

	test('handles long strings', async () => {
		const plaintext = 'a'.repeat(10000)
		const encrypted = await encrypt(plaintext)
		const decrypted = await decrypt(encrypted)

		expect(decrypted).toBe(plaintext)
		expect(encrypted.length).toBeGreaterThan(plaintext.length)
	})
})
