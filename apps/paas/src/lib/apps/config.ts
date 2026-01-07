import { createDb } from '@/db/client'
import { environmentVariables, projects } from '@/db/schema'
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'
import { and, eq } from 'drizzle-orm'

/**
 * Application Configuration Management
 * Handles build configuration, environment variables, and settings
 */

export interface BuildConfig {
	buildCommand?: string
	installCommand?: string
	outputDirectory?: string
	rootDirectory?: string
	nodeVersion?: string
	framework?: string
}

/**
 * Updates build configuration for a project
 * @param projectId - Project ID
 * @param config - Build configuration to update
 */
export async function updateBuildConfig(
	projectId: string,
	config: BuildConfig,
): Promise<void> {
	const db = createDb()

	await db
		.update(projects)
		.set({
			buildCommand: config.buildCommand,
			installCommand: config.installCommand,
			outputDirectory: config.outputDirectory,
			rootDirectory: config.rootDirectory,
			nodeVersion: config.nodeVersion,
			framework: config.framework as any,
			updatedAt: new Date().toISOString(),
		})
		.where(eq(projects.id, projectId))
}

/**
 * Environment variable input
 */
export interface EnvVarInput {
	key: string
	value: string
	isSecret?: boolean
	target?: ('production' | 'preview' | 'development')[]
}

/**
 * Sets an environment variable for a project
 * @param projectId - Project ID
 * @param envVar - Environment variable to set
 */
export async function setEnvVar(
	projectId: string,
	envVar: EnvVarInput,
): Promise<void> {
	const db = createDb()

	// Encrypt value if it's a secret
	const valueEncrypted = envVar.isSecret
		? encryptValue(envVar.value)
		: envVar.value

	await db
		.insert(environmentVariables)
		.values({
			id: crypto.randomUUID(),
			projectId,
			key: envVar.key,
			valueEncrypted,
			target: envVar.target || ['production', 'preview', 'development'],
			type: envVar.isSecret ? 'encrypted' : 'plain',
		})
		.onConflictDoUpdate({
			target: [environmentVariables.projectId, environmentVariables.key],
			set: {
				valueEncrypted,
				target: envVar.target || ['production', 'preview', 'development'],
				type: envVar.isSecret ? 'encrypted' : 'plain',
				updatedAt: new Date().toISOString(),
			},
		})
}

/**
 * Gets all environment variables for a project
 * @param projectId - Project ID
 * @param includeValues - Whether to include decrypted values (default: false)
 * @returns List of environment variables
 */
export async function getEnvVars(
	projectId: string,
	includeValues = false,
): Promise<
	Array<{
		id: string
		key: string
		value?: string
		target: ('production' | 'preview' | 'development')[]
		type: 'encrypted' | 'plain' | 'system'
	}>
> {
	const db = createDb()

	const vars = await db.query.environmentVariables.findMany({
		where: eq(environmentVariables.projectId, projectId),
	})

	return vars.map((v) => {
		const result: {
			id: string
			key: string
			value?: string
			target: ('production' | 'preview' | 'development')[]
			type: 'encrypted' | 'plain' | 'system'
		} = {
			id: v.id,
			key: v.key,
			target: v.target || ['production', 'preview', 'development'],
			type: v.type,
		}

		if (includeValues) {
			result.value = v.type === 'encrypted'
				? decryptValue(v.valueEncrypted)
				: v.valueEncrypted
		}

		return result
	})
}

/**
 * Deletes an environment variable
 * @param projectId - Project ID
 * @param key - Environment variable key
 */
export async function deleteEnvVar(
	projectId: string,
	key: string,
): Promise<void> {
	const db = createDb()

	await db
		.delete(environmentVariables)
		.where(
			and(
				eq(environmentVariables.projectId, projectId),
				eq(environmentVariables.key, key),
			),
		)
}

/**
 * Updates application settings
 * @param projectId - Project ID
 * @param settings - Settings to update
 */
export async function updateAppSettings(
	projectId: string,
	settings: {
		name?: string
		description?: string
		productionBranch?: string
		autoDeploy?: boolean
		rootDirectory?: string
	},
): Promise<void> {
	const db = createDb()

	await db
		.update(projects)
		.set({
			name: settings.name,
			description: settings.description,
			productionBranch: settings.productionBranch,
			autoDeploy: settings.autoDeploy,
			rootDirectory: settings.rootDirectory,
			updatedAt: new Date().toISOString(),
		})
		.where(eq(projects.id, projectId))
}

/**
 * Encrypts a value using AES-256-GCM
 * In production, use a proper key management service
 */
function encryptValue(value: string): string {
	const key = getEncryptionKey()
	const iv = randomBytes(16)
	const cipher = createCipheriv('aes-256-gcm', key, iv)

	let encrypted = cipher.update(value, 'utf8', 'hex')
	encrypted += cipher.final('hex')

	const authTag = cipher.getAuthTag()

	// Return: iv:authTag:encrypted
	return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypts a value encrypted with encryptValue
 */
function decryptValue(encrypted: string): string {
	const key = getEncryptionKey()
	const parts = encrypted.split(':')

	if (parts.length !== 3) {
		throw new Error('Invalid encrypted value format')
	}

	const iv = Buffer.from(parts[0]!, 'hex')
	const authTag = Buffer.from(parts[1]!, 'hex')
	const encryptedText = parts[2]!

	const decipher = createDecipheriv('aes-256-gcm', key, iv)
	decipher.setAuthTag(authTag)

	let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
	decrypted += decipher.final('utf8')

	return decrypted
}

/**
 * Gets the encryption key from environment
 * In production, use AWS KMS, HashiCorp Vault, or similar
 */
function getEncryptionKey(): Buffer {
	const key = process.env.ENCRYPTION_KEY || 'development-key-32-bytes-long!!'

	if (key.length !== 32) {
		throw new Error('Encryption key must be 32 bytes long')
	}

	return Buffer.from(key)
}

/**
 * Validates build configuration
 */
export function validateBuildConfig(config: BuildConfig): {
	valid: boolean
	errors: string[]
} {
	const errors: string[] = []

	if (config.nodeVersion) {
		const version = parseInt(config.nodeVersion)
		if (isNaN(version) || version < 14 || version > 22) {
			errors.push('Node version must be between 14 and 22')
		}
	}

	if (config.rootDirectory && !config.rootDirectory.startsWith('/')) {
		errors.push('Root directory must start with /')
	}

	return {
		valid: errors.length === 0,
		errors,
	}
}

/**
 * Validates environment variable key
 */
export function validateEnvVarKey(key: string): boolean {
	// Environment variable keys must:
	// - Start with a letter or underscore
	// - Contain only letters, numbers, and underscores
	// - Not be empty
	return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)
}
