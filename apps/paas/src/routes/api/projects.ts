import {
	getApplicationDetails,
	getUserApplications,
	getDeploymentStats,
	getRecentActivity,
} from '@/lib/apps/data'
import { importRepository } from '@/lib/apps/import'
import {
	updateBuildConfig,
	updateAppSettings,
	setEnvVar,
	getEnvVars,
	deleteEnvVar,
} from '@/lib/apps/config'
import { getCurrentUser } from '@/lib/session'
import { createServerFn } from '@tanstack/react-start'

/**
 * Get all projects for the current user
 */
export const getProjects = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await getCurrentUser()
		const applications = await getUserApplications(userId)

		// Transform to UI format
		return applications.map((app) => ({
			id: app.id,
			name: app.name,
			domain: app.productionUrl?.replace('https://', '').replace('http://', '') || `${app.slug}.paas.local`,
			status: app.status === 'deployed' ? 'ready' as const : app.status === 'building' ? 'building' as const : 'error' as const,
			branch: 'main', // TODO: get from deployment
			commit: app.currentDeploymentId?.slice(0, 7) || 'No deploys',
			updatedAt: app.lastDeployedAt ? new Date(app.lastDeployedAt).toLocaleDateString() : 'Never',
			updatedAtTimestamp: app.lastDeployedAt || app.updatedAt,
			author: 'GitHub', // TODO: get from deployment
			repo: app.repositoryName,
		}))
	},
)

/**
 * Get a single project by ID
 */
export const getProject = createServerFn({ method: 'GET' })
	.inputValidator((id: string) => id)
	.handler(async ({ data: id }) => {
		await getCurrentUser() // Verify authentication
		const details = await getApplicationDetails(id)

		if (!details) {
			throw new Error('Project not found')
		}

		// Add repo and domain fields for UI compatibility
		return {
			...details,
			repo: details.repositoryName,
			domain: details.domains?.[0]?.domain || `${details.slug}.paas.local`,
		}
	})

/**
 * Get deployment statistics for a project
 */
export const getProjectStats = createServerFn({ method: 'GET' })
	.inputValidator((projectId: string) => projectId)
	.handler(async ({ data: projectId }) => {
		await getCurrentUser()
		return await getDeploymentStats(projectId)
	})

/**
 * Get recent activity for a project
 */
export const getProjectActivity = createServerFn({ method: 'GET' })
	.inputValidator((input: { projectId: string; limit?: number }) => input)
	.handler(async ({ data: { projectId, limit } }) => {
		await getCurrentUser()
		return await getRecentActivity(projectId, limit)
	})

/**
 * Import a repository as a new project
 */
export const importRepo = createServerFn({ method: 'POST' })
	.inputValidator(
		(input: {
			teamId: string
			repositoryId: string
			repositoryName: string
			repositoryOwner: string
			repositoryUrl: string
			defaultBranch: string
			description?: string
		}) => input,
	)
	.handler(async ({ data: input }) => {
		const userId = await getCurrentUser()
		return await importRepository({ userId, ...input })
	})

/**
 * Update project build configuration
 */
export const updateProjectBuildConfig = createServerFn({ method: 'POST' })
	.inputValidator(
		(input: {
			projectId: string
			buildCommand?: string
			installCommand?: string
			outputDirectory?: string
			rootDirectory?: string
			nodeVersion?: string
			framework?: string
		}) => input,
	)
	.handler(async ({ data: { projectId, ...config } }) => {
		await getCurrentUser()
		await updateBuildConfig(projectId, config)
		return { success: true }
	})

/**
 * Update project settings
 */
export const updateProjectSettings = createServerFn({ method: 'POST' })
	.inputValidator(
		(input: {
			projectId: string
			name?: string
			description?: string
			productionBranch?: string
			autoDeploy?: boolean
			rootDirectory?: string
		}) => input,
	)
	.handler(async ({ data: { projectId, ...settings } }) => {
		await getCurrentUser()
		await updateAppSettings(projectId, settings)
		return { success: true }
	})

/**
 * Get environment variables for a project
 */
export const getProjectEnvVars = createServerFn({ method: 'GET' })
	.inputValidator((projectId: string) => projectId)
	.handler(async ({ data: projectId }) => {
		await getCurrentUser()
		return await getEnvVars(projectId, false) // Don't include values for security
	})

/**
 * Set an environment variable
 */
export const setProjectEnvVar = createServerFn({ method: 'POST' })
	.inputValidator(
		(input: {
			projectId: string
			key: string
			value: string
			isSecret?: boolean
			target?: ('production' | 'preview' | 'development')[]
		}) => input,
	)
	.handler(async ({ data: { projectId, ...envVar } }) => {
		await getCurrentUser()
		await setEnvVar(projectId, envVar)
		return { success: true }
	})

/**
 * Delete an environment variable
 */
export const deleteProjectEnvVar = createServerFn({ method: 'POST' })
	.inputValidator((input: { projectId: string; key: string }) => input)
	.handler(async ({ data: { projectId, key } }) => {
		await getCurrentUser()
		await deleteEnvVar(projectId, key)
		return { success: true }
	})
