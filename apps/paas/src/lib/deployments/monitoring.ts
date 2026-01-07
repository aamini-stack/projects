import { createDb } from '@/db/client'
import { deployments, previewEnvironments, projects } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { triggerBuild } from './builds'

/**
 * Monitoring & Preview Deployments
 * Handles preview environments, health checks, and monitoring
 */

export interface CreatePreviewInput {
	projectId: string
	prNumber: number
	branch: string
	commitSha: string
	prTitle: string
	prUrl: string
}

/**
 * Creates a preview deployment for a pull request
 * @param input - Preview deployment configuration
 */
export async function createPreviewDeployment(
	input: CreatePreviewInput,
): Promise<string> {
	const db = createDb()

	// Find or create preview environment
	let preview = await db.query.previewEnvironments.findFirst({
		where: and(
			eq(previewEnvironments.projectId, input.projectId),
			eq(previewEnvironments.branch, input.branch),
		),
	})

	if (!preview) {
		const [newPreview] = await db
			.insert(previewEnvironments)
			.values({
				id: crypto.randomUUID(),
				projectId: input.projectId,
				branch: input.branch,
				pullRequestNumber: input.prNumber,
				pullRequestUrl: input.prUrl,
				status: 'active',
				lastActivityAt: new Date().toISOString(),
			})
			.returning()

		preview = newPreview!
	} else {
		// Update existing preview
		await db
			.update(previewEnvironments)
			.set({
				pullRequestNumber: input.prNumber,
				pullRequestUrl: input.prUrl,
				status: 'active',
				lastActivityAt: new Date().toISOString(),
			})
			.where(eq(previewEnvironments.id, preview.id))
	}

	// Trigger build for preview
	const deploymentId = await triggerBuild({
		projectId: input.projectId,
		commitSha: input.commitSha,
		commitMessage: input.prTitle,
		commitAuthorName: 'GitHub',
		commitAuthorEmail: '',
		branch: input.branch,
		environment: 'preview',
		triggeredBy: 'pull_request',
		pullRequestNumber: input.prNumber,
		pullRequestTitle: input.prTitle,
	})

	// Update preview with deployment ID
	await db
		.update(previewEnvironments)
		.set({ currentDeploymentId: deploymentId })
		.where(eq(previewEnvironments.id, preview.id))

	return deploymentId
}

/**
 * Cleans up a preview deployment when PR is closed
 * @param projectId - Project ID
 * @param prNumber - Pull request number
 */
export async function cleanupPreviewDeployment(
	projectId: string,
	prNumber: number,
): Promise<void> {
	const db = createDb()

	const preview = await db.query.previewEnvironments.findFirst({
		where: and(
			eq(previewEnvironments.projectId, projectId),
			eq(previewEnvironments.pullRequestNumber, prNumber),
		),
		with: {
			currentDeployment: true,
		},
	})

	if (!preview) {
		return
	}

	// Stop container if deployment exists
	if (preview.currentDeployment) {
		try {
			const { stopContainer } = await import('./containers')
			const project = await db.query.projects.findFirst({
				where: eq(projects.id, projectId),
			})

			if (project) {
				const containerName = `${project.slug}-preview-${preview.currentDeployment.id.slice(0, 8)}`
				await stopContainer(containerName)
			}
		} catch (error) {
			console.error('Failed to stop preview container:', error)
		}
	}

	// Mark preview as deleted
	await db
		.update(previewEnvironments)
		.set({
			status: 'deleted',
			scheduledDeletionAt: new Date().toISOString(),
		})
		.where(eq(previewEnvironments.id, preview.id))
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
	deploymentId: string
	url: string
	interval: number // seconds
	timeout: number // seconds
	failureThreshold: number
}

/**
 * Enables health check monitoring for a deployment
 * @param config - Health check configuration
 */
export async function enableHealthCheck(
	config: HealthCheckConfig,
): Promise<void> {
	// In production, this would:
	// 1. Store health check config in database
	// 2. Schedule periodic health checks with job queue
	// 3. Track health check history
	// 4. Send alerts on failures

	// For now, just log
	console.log('Health check enabled for deployment:', config.deploymentId)
}

/**
 * Performs a health check on a deployment
 * @param deploymentId - Deployment ID
 * @returns Health status
 */
export async function checkHealth(
	deploymentId: string,
): Promise<'healthy' | 'unhealthy' | 'unknown'> {
	const db = createDb()

	const deployment = await db.query.deployments.findFirst({
		where: eq(deployments.id, deploymentId),
	})

	if (!deployment || deployment.status !== 'ready') {
		return 'unknown'
	}

	// Get deployment URL from domain
	const project = await db.query.projects.findFirst({
		where: eq(projects.id, deployment.projectId),
		with: {
			domains: {
				where: (d, { eq }) => eq(d.environment, deployment.environment),
			},
		},
	})

	if (!project || project.domains.length === 0) {
		return 'unknown'
	}

	const domain = project.domains[0]!
	const healthUrl = `http://${domain.domain}/health`

	try {
		const response = await fetch(healthUrl, {
			method: 'GET',
			signal: AbortSignal.timeout(5000),
		})

		return response.ok ? 'healthy' : 'unhealthy'
	} catch {
		return 'unhealthy'
	}
}

/**
 * Gets health status for a deployment
 * @param deploymentId - Deployment ID
 * @returns Health status with details
 */
export async function getHealthStatus(deploymentId: string): Promise<{
	status: 'healthy' | 'unhealthy' | 'unknown'
	lastCheckAt?: string
	consecutiveFailures?: number
}> {
	const status = await checkHealth(deploymentId)

	// In production, retrieve from health check history table
	return {
		status,
		lastCheckAt: new Date().toISOString(),
		consecutiveFailures: 0,
	}
}

/**
 * Monitors deployment health continuously
 * This would run as a background job in production
 */
export async function monitorDeploymentHealth(
	deploymentId: string,
	config: {
		interval: number
		failureThreshold: number
	},
): Promise<void> {
	let consecutiveFailures = 0

	setInterval(async () => {
		const status = await checkHealth(deploymentId)

		if (status === 'unhealthy') {
			consecutiveFailures++

			if (consecutiveFailures >= config.failureThreshold) {
				// Send alert
				console.error(
					`Deployment ${deploymentId} has failed health checks ${consecutiveFailures} times`,
				)

				// In production:
				// - Send webhook notification
				// - Send email/Slack alert
				// - Optionally trigger auto-rollback
			}
		} else if (status === 'healthy') {
			consecutiveFailures = 0
		}
	}, config.interval * 1000)

	// Store interval ID to allow cleanup
	// In production, use job queue system instead of setInterval
	return
}

/**
 * Auto-sleeps idle preview deployments to save resources
 * This would run as a scheduled job in production
 */
export async function autoSleepPreviews(): Promise<void> {
	const db = createDb()

	const now = new Date()
	// const cutoffTime = new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago

	// Find active previews with no recent activity
	const idlePreviews = await db.query.previewEnvironments.findMany({
		where: and(
			eq(previewEnvironments.status, 'active'),
			// In production, add: lt(previewEnvironments.lastActivityAt, cutoffTime.toISOString())
		),
	})

	for (const preview of idlePreviews) {
		// Check if sleep time has elapsed
		if (!preview.lastActivityAt) continue

		const lastActivity = new Date(preview.lastActivityAt)
		const minutesSinceActivity =
			(now.getTime() - lastActivity.getTime()) / 1000 / 60

		if (minutesSinceActivity >= (preview.sleepAfterMinutes || 60)) {
			// Sleep the preview
			await db
				.update(previewEnvironments)
				.set({ status: 'sleeping' })
				.where(eq(previewEnvironments.id, preview.id))

			// Stop container
			if (preview.currentDeploymentId) {
				try {
					const { stopContainer } = await import('./containers')
					const project = await db.query.projects.findFirst({
						where: eq(projects.id, preview.projectId),
					})

					if (project) {
						const containerName = `${project.slug}-preview-${preview.currentDeploymentId.slice(0, 8)}`
						await stopContainer(containerName)
					}
				} catch (error) {
					console.error('Failed to stop sleeping preview:', error)
				}
			}
		}
	}
}

/**
 * Auto-deletes old preview deployments
 * This would run as a scheduled job in production
 */
export async function autoDeleteOldPreviews(): Promise<void> {
	const db = createDb()

	const now = new Date()

	// Find previews scheduled for deletion
	const oldPreviews = await db.query.previewEnvironments.findMany({
		where: eq(previewEnvironments.status, 'deleted'),
	})

	for (const preview of oldPreviews) {
		if (!preview.scheduledDeletionAt) continue

		const scheduledDeletion = new Date(preview.scheduledDeletionAt)
		const daysSinceDeletion =
			(now.getTime() - scheduledDeletion.getTime()) / 1000 / 60 / 60 / 24

		if (daysSinceDeletion >= (preview.autoDeleteAfterDays || 7)) {
			// Actually delete the preview
			// In production, also clean up associated resources
			// For now, keep the record for audit purposes
		}
	}
}
