import { createDb } from '@/db/client'
import { projects, teams } from '@/db/schema'
import { createWebhook } from '@/lib/github/webhooks'
import { eq } from 'drizzle-orm'

function generateRandomBytes(size: number): string {
	const array = new Uint8Array(size)
	crypto.getRandomValues(array)
	return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
		'',
	)
}

/**
 * Application Import
 * Handles importing GitHub repositories as managed applications
 */

export interface ImportRepositoryInput {
	userId: string
	teamId: string
	repositoryId: string
	repositoryName: string
	repositoryOwner: string
	repositoryUrl: string
	defaultBranch: string
	description?: string
}

export interface ImportRepositoryResult {
	projectId: string
	webhookRegistered: boolean
	webhookId?: string
}

/**
 * Imports a GitHub repository as a new application
 * @param input - Repository import configuration
 * @returns Import result with project ID and webhook status
 */
export async function importRepository(
	input: ImportRepositoryInput,
): Promise<ImportRepositoryResult> {
	const db = createDb()

	// Verify team exists and user has access
	const team = await db.query.teams.findFirst({
		where: eq(teams.id, input.teamId),
		with: {
			members: {
				where: (members, { eq }) => eq(members.userId, input.userId),
			},
		},
	})

	if (!team) {
		throw new Error('Team not found')
	}

	if (team.members.length === 0) {
		throw new Error('User is not a member of this team')
	}

	// Get user's GitHub access token
	const token = await db.query.oauthTokens.findFirst({
		where: (tokens, { and, eq }) =>
			and(eq(tokens.userId, input.userId), eq(tokens.provider, 'github')),
	})

	if (!token) {
		throw new Error('GitHub OAuth token not found')
	}

	// Generate webhook secret
	const webhookSecret = generateRandomBytes(32)

	// Generate project slug from repository name
	const slug = generateSlug(input.repositoryName)

	// Create project record
	const [project] = await db
		.insert(projects)
		.values({
			id: crypto.randomUUID(),
			teamId: input.teamId,
			name: input.repositoryName,
			slug,
			description: input.description || null,
			repositoryUrl: input.repositoryUrl,
			repositoryId: input.repositoryId,
			repositoryOwner: input.repositoryOwner,
			repositoryName: input.repositoryName,
			defaultBranch: input.defaultBranch,
			productionBranch: input.defaultBranch,
			webhookSecret,
			autoDeploy: true,
			// Default build configuration - will be auto-detected later
			buildCommand: null,
			installCommand: 'npm install',
			outputDirectory: null,
			rootDirectory: '/',
			nodeVersion: '20',
		})
		.returning()

	if (!project) {
		throw new Error('Failed to create project')
	}

	// Register webhook with GitHub
	let webhookRegistered = false
	let webhookId: string | undefined

	try {
		const webhookUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/webhooks/github`

		const webhook = await createWebhook(
			input.repositoryOwner,
			input.repositoryName,
			token.accessTokenEncrypted, // TODO: decrypt in production
			{
				url: webhookUrl,
				secret: webhookSecret,
				events: ['push', 'pull_request', 'deployment', 'deployment_status'],
				active: true,
			},
		)

		webhookId = String(webhook.id)
		webhookRegistered = true

		// Update project with webhook ID
		await db
			.update(projects)
			.set({ webhookId })
			.where(eq(projects.id, project.id))
	} catch (error) {
		console.error('Failed to register webhook:', error)
		// Don't fail the import if webhook registration fails
		// User can manually trigger the first deployment
	}

	const result: ImportRepositoryResult = {
		projectId: project.id,
		webhookRegistered,
	}

	if (webhookId) {
		result.webhookId = webhookId
	}

	return result
}

/**
 * Generates a URL-safe slug from a string
 */
function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
}

/**
 * Detects the framework used in a repository
 * @param packageJson - Parsed package.json content
 * @returns Detected framework or 'custom'
 */
export function detectFramework(packageJson: any): string {
	const dependencies = {
		...packageJson.dependencies,
		...packageJson.devDependencies,
	}

	if (dependencies.next || dependencies['@next/core']) {
		return 'nextjs'
	}
	if (dependencies.remix || dependencies['@remix-run/react']) {
		return 'remix'
	}
	if (dependencies.astro) {
		return 'astro'
	}
	if (dependencies.vite || dependencies['@vitejs/plugin-react']) {
		return 'vite'
	}
	if (dependencies.react || dependencies['react-dom']) {
		return 'react'
	}

	return 'custom'
}

/**
 * Gets recommended build configuration based on framework
 */
export function getDefaultBuildConfig(framework: string): {
	buildCommand: string
	outputDirectory: string
	installCommand: string
} {
	switch (framework) {
		case 'nextjs':
			return {
				buildCommand: 'npm run build',
				outputDirectory: '.next',
				installCommand: 'npm install',
			}
		case 'remix':
			return {
				buildCommand: 'npm run build',
				outputDirectory: 'build',
				installCommand: 'npm install',
			}
		case 'vite':
		case 'react':
			return {
				buildCommand: 'npm run build',
				outputDirectory: 'dist',
				installCommand: 'npm install',
			}
		case 'astro':
			return {
				buildCommand: 'npm run build',
				outputDirectory: 'dist',
				installCommand: 'npm install',
			}
		default:
			return {
				buildCommand: 'npm run build',
				outputDirectory: 'dist',
				installCommand: 'npm install',
			}
	}
}
