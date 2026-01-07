import { getDeploymentDetails } from '@/lib/apps/data'
import { getBuildLogs, triggerBuild } from '@/lib/deployments/builds'
import { getCurrentUser } from '@/lib/session'
import { createServerFn } from '@tanstack/react-start'
import { createDb } from '@/db/client'
import { deployments } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'

// Helper function to transform deployment to UI format
function transformDeploymentToUI(deployment: any) {
	const duration = deployment.buildStartedAt && deployment.buildFinishedAt
		? Math.round((new Date(deployment.buildFinishedAt).getTime() - new Date(deployment.buildStartedAt).getTime()) / 1000)
		: 0

	return {
		id: deployment.id,
		projectId: deployment.projectId,
		projectName: deployment.project?.name || 'Unknown',
		repo: deployment.project?.repositoryName || 'unknown/repo',
		commitMessage: deployment.commitMessage || 'No message',
		commitSha: deployment.commitSha.slice(0, 7),
		branch: deployment.branch,
		time: new Date(deployment.createdAt).toLocaleString(),
		timestamp: deployment.createdAt,
		duration: duration > 0 ? `${duration}s` : '-',
		author: deployment.commitAuthorName || 'Unknown',
		status: mapDeploymentStatus(deployment.status),
		env: deployment.environment,
		isCurrent: deployment.project?.currentProductionDeploymentId === deployment.id,
	}
}

// Map database status to UI status
function mapDeploymentStatus(status: string): 'built' | 'provisioning' | 'failed' | 'canceled' {
	switch (status) {
		case 'ready':
			return 'built'
		case 'queued':
		case 'building':
		case 'deploying':
			return 'provisioning'
		case 'failed':
			return 'failed'
		case 'canceled':
			return 'canceled'
		default:
			return 'failed'
	}
}

/**
 * Get all deployments for the current user's projects
 */
export const getAllDeployments = createServerFn({ method: 'GET' })
	.inputValidator((params: { limit?: number; offset?: number } = {}) => params)
	.handler(async ({ data: { limit = 20, offset = 0 } }) => {
		await getCurrentUser()
		const db = createDb()

		// Get all deployments ordered by creation time
		const allDeployments = await db.query.deployments.findMany({
			orderBy: [desc(deployments.createdAt)],
			limit,
			offset,
			with: {
				project: true,
			},
		})

		// Transform to UI format
		return {
			items: allDeployments.map(transformDeploymentToUI),
			total: allDeployments.length,
			limit,
			offset,
		}
	})

/**
 * Get deployments for a specific project
 */
export const getProjectDeployments = createServerFn({ method: 'GET' })
	.inputValidator(
		(params: { projectId: string; limit?: number; offset?: number }) => params,
	)
	.handler(async ({ data: { projectId, limit = 20, offset = 0 } }) => {
		await getCurrentUser()
		const db = createDb()

		const projectDeployments = await db.query.deployments.findMany({
			where: eq(deployments.projectId, projectId),
			orderBy: [desc(deployments.createdAt)],
			limit,
			offset,
			with: {
				project: true,
			},
		})

		return {
			items: projectDeployments.map(transformDeploymentToUI),
			total: projectDeployments.length,
			limit,
			offset,
		}
	})

/**
 * Get a single deployment with full details
 */
export const getDeployment = createServerFn({ method: 'GET' })
	.inputValidator((id: string) => id)
	.handler(async ({ data: id }) => {
		await getCurrentUser()
		const details = await getDeploymentDetails(id)

		if (!details) {
			throw new Error('Deployment not found')
		}

		return transformDeploymentToUI(details)
	})

/**
 * Get build logs for a deployment
 */
export const getDeploymentLogs = createServerFn({ method: 'GET' })
	.inputValidator((deploymentId: string) => deploymentId)
	.handler(async ({ data: deploymentId }) => {
		await getCurrentUser()
		return await getBuildLogs(deploymentId)
	})

/**
 * Manually trigger a deployment
 */
export const triggerDeployment = createServerFn({ method: 'POST' })
	.inputValidator(
		(input: {
			projectId: string
			branch?: string
			commitSha?: string
			commitMessage?: string
		}) => input,
	)
	.handler(async ({ data: { projectId, branch, commitSha, commitMessage } }) => {
		const userId = await getCurrentUser()
		const db = createDb()

		// Get project details
		const project = await db.query.projects.findFirst({
			where: eq(deployments.projectId, projectId),
		})

		if (!project) {
			throw new Error('Project not found')
		}

		// Use provided values or defaults from project
		const deploymentBranch = branch || project.productionBranch
		const sha = commitSha || 'HEAD'
		const message = commitMessage || 'Manual deployment'

		const deploymentId = await triggerBuild({
			projectId,
			commitSha: sha,
			commitMessage: message,
			commitAuthorName: 'Manual',
			commitAuthorEmail: '',
			branch: deploymentBranch,
			environment: 'production',
			triggeredBy: 'manual',
			triggeredByUserId: userId,
		})

		return { deploymentId, success: true }
	})

/**
 * Cancel a running deployment
 */
export const cancelDeployment = createServerFn({ method: 'POST' })
	.inputValidator((deploymentId: string) => deploymentId)
	.handler(async ({ data: deploymentId }) => {
		await getCurrentUser()
		const db = createDb()

		// Update deployment status to canceled
		await db
			.update(deployments)
			.set({
				status: 'canceled',
				errorMessage: 'Deployment canceled by user',
			})
			.where(eq(deployments.id, deploymentId))

		// TODO: Actually stop the build process (would need job queue integration)

		return { success: true }
	})
