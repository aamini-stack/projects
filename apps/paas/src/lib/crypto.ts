/**
 * Encryption utilities for sensitive data
 * Uses AES-256-GCM for encryption with Web Crypto API
 */

// Get encryption key from environment
function getEncryptionKey(): string {
	const key = process.env.ENCRYPTION_KEY
	if (!key) {
		throw new Error(
			'ENCRYPTION_KEY environment variable is not set. Please set a 32-byte hex string.',
		)
	}
	if (key.length !== 64) {
		// 32 bytes = 64 hex characters
		throw new Error(
			'ENCRYPTION_KEY must be a 32-byte hex string (64 characters)',
		)
	}
	return key
}

/**
 * Converts a hex string to Uint8Array backed by ArrayBuffer
 */
function hexToBytes(hex: string): Uint8Array {
	const buffer = new ArrayBuffer(hex.length / 2)
	const bytes = new Uint8Array(buffer)
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
	}
	return bytes
}

/**
 * Converts Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
		'',
	)
}

/**
 * Encrypts a string value using AES-256-GCM
 * @param plaintext - The value to encrypt
 * @returns Encrypted value as hex string (format: iv:ciphertext:tag)
 */
export async function encrypt(plaintext: string): Promise<string> {
	if (!plaintext) {
		return ''
	}

	try {
		const keyHex = getEncryptionKey()
		const keyBytes = hexToBytes(keyHex)

		// Import the key for AES-GCM
		const cryptoKey = await crypto.subtle.importKey(
			'raw',
			keyBytes.buffer as ArrayBuffer,
			{ name: 'AES-GCM', length: 256 },
			false,
			['encrypt'],
		)

		// Generate a random IV (12 bytes for GCM)
		const iv = crypto.getRandomValues(new Uint8Array(12))

		// Encode the plaintext
		const encoder = new TextEncoder()
		const data = encoder.encode(plaintext)

		// Encrypt
		const ciphertext = await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv, tagLength: 128 },
			cryptoKey,
			data,
		)

		// Format: iv:ciphertext (IV is needed for decryption)
		const ivHex = bytesToHex(iv)
		const ciphertextHex = bytesToHex(new Uint8Array(ciphertext))

		return `${ivHex}:${ciphertextHex}`
	} catch (error) {
		throw new Error(
			`Encryption failed: ${error instanceof Error ? error.message : String(error)}`,
		)
	}
}

/**
 * Decrypts an encrypted string value
 * @param encrypted - The encrypted value (format: iv:ciphertext:tag)
 * @returns Decrypted plaintext
 */
export async function decrypt(encrypted: string): Promise<string> {
	if (!encrypted) {
		return ''
	}

	try {
		const keyHex = getEncryptionKey()
		const keyBytes = hexToBytes(keyHex)

		// Import the key for AES-GCM
		const cryptoKey = await crypto.subtle.importKey(
			'raw',
			keyBytes.buffer as ArrayBuffer,
			{ name: 'AES-GCM', length: 256 },
			false,
			['decrypt'],
		)

		// Parse the encrypted value
		const [ivHex, ciphertextHex] = encrypted.split(':')
		if (!ivHex || !ciphertextHex) {
			throw new Error('Invalid encrypted value format')
		}

		const iv = hexToBytes(ivHex)
		const ciphertext = hexToBytes(ciphertextHex)

		// Decrypt
		const plaintext = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer, tagLength: 128 },
			cryptoKey,
			ciphertext.buffer as ArrayBuffer,
		)

		// Decode the plaintext
		const decoder = new TextDecoder()
		return decoder.decode(plaintext)
	} catch (error) {
		throw new Error(
			`Decryption failed: ${error instanceof Error ? error.message : String(error)}`,
		)
	}
}

/**
 * Generates a random encryption key (32 bytes = 256 bits)
 * Use this to generate ENCRYPTION_KEY for your .env file
 * @returns Hex string of random bytes
 */
export function generateEncryptionKey(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32))
	return bytesToHex(bytes)
}

/**
 * Helper to check if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
	try {
		const key = process.env.ENCRYPTION_KEY
		return !!key && key.length === 64
	} catch {
		return false
	}
}
