import { createDb } from '@/db/client'
import { projects, webhookDeliveries } from '@/db/schema'
import {
	type BaseWebhookPayload,
	type GitHubWebhookEvent,
	type PullRequestEventPayload,
	type PushEventPayload,
	shouldCleanupPreview,
	shouldCreatePreview,
	shouldTriggerDeployment,
	verifyWebhookSignature,
} from '@/lib/github/webhooks'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

/**
 * GitHub Webhook Handler
 * Receives and processes webhook events from GitHub
 */

interface WebhookPayload {
	signature: string
	event: GitHubWebhookEvent
	deliveryId: string
	rawPayload: string
	payload: BaseWebhookPayload
}

export const handleGitHubWebhook = createServerFn({ method: 'POST' })
	.inputValidator((data: WebhookPayload) => data)
	.handler(async ({ data }) => {
		const db = createDb()

		const { signature, event, deliveryId, rawPayload, payload } = data

		if (!signature || !event || !deliveryId) {
			throw new Error('Missing required webhook headers')
		}

		// Find the project by repository ID
		const project = await db.query.projects.findFirst({
			where: eq(projects.repositoryId, String(payload.repository.id)),
		})

		if (!project) {
			// Log webhook for non-existent project (might be before import)
			await db.insert(webhookDeliveries).values({
				id: crypto.randomUUID(),
				projectId: null,
				deliveryId,
				eventType: event,
				payload: payload as any,
				signatureValid: false,
				processingStatus: 'ignored',
			})

			return { status: 'ignored', message: 'Project not found' }
		}

		// Verify webhook signature
		const isValid = verifyWebhookSignature(
			rawPayload,
			signature,
			project.webhookSecret,
		)

		// Store webhook delivery
		const [delivery] = await db
			.insert(webhookDeliveries)
			.values({
				id: crypto.randomUUID(),
				projectId: project.id,
				deliveryId,
				eventType: event,
				payload: payload as any,
				signatureValid: isValid,
				processingStatus: isValid ? 'pending' : 'ignored',
			})
			.returning()

		if (!isValid) {
			return { status: 'error', message: 'Invalid signature' }
		}

		// Process webhook based on event type
		try {
			await db
				.update(webhookDeliveries)
				.set({ processingStatus: 'processing' })
				.where(eq(webhookDeliveries.id, delivery!.id))

			switch (event) {
				case 'push':
					await handlePushEvent(
						payload as PushEventPayload,
						project,
						delivery!.id,
					)
					break
				case 'pull_request':
					await handlePullRequestEvent(
						payload as PullRequestEventPayload,
						project,
						delivery!.id,
					)
					break
				case 'ping':
					// Ping events are just to verify webhook is working
					break
				default:
					// Unsupported event type - just log it
					break
			}

			await db
				.update(webhookDeliveries)
				.set({
					processingStatus: 'completed',
					processedAt: new Date().toISOString(),
				})
				.where(eq(webhookDeliveries.id, delivery!.id))

			return { status: 'success' }
		} catch (error) {
			// Log error
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error'

			await db
				.update(webhookDeliveries)
				.set({
					processingStatus: 'failed',
					errorMessage,
					processedAt: new Date().toISOString(),
				})
				.where(eq(webhookDeliveries.id, delivery!.id))

			return { status: 'error', message: errorMessage }
		}
	})

/**
 * Handles push events - triggers production deployments
 */
async function handlePushEvent(
	payload: PushEventPayload,
	project: any,
	deliveryId: string,
): Promise<void> {
	const db = createDb()

	// Check if this push should trigger a deployment
	if (!shouldTriggerDeployment(payload, project.productionBranch)) {
		return
	}

	if (!project.autoDeploy) {
		return
	}

	// Import dynamically to avoid circular dependencies
	const { triggerBuild } = await import('@/lib/deployments/builds')

	const deploymentId = await triggerBuild({
		projectId: project.id,
		commitSha: payload.after,
		commitMessage: payload.head_commit?.message || 'No commit message',
		commitAuthorName: payload.head_commit?.author.name || 'Unknown',
		commitAuthorEmail: payload.head_commit?.author.email || '',
		branch: payload.ref.replace('refs/heads/', ''),
		environment: 'production',
		triggeredBy: 'push',
	})

	// Link deployment to webhook delivery
	await db
		.update(webhookDeliveries)
		.set({ deploymentId })
		.where(eq(webhookDeliveries.id, deliveryId))
}

/**
 * Handles pull request events - manages preview deployments
 */
async function handlePullRequestEvent(
	payload: PullRequestEventPayload,
	project: any,
	_deliveryId: string,
): Promise<void> {
	// Import dynamically to avoid circular dependencies
	const { createPreviewDeployment, cleanupPreviewDeployment } = await import(
		'@/lib/deployments/monitoring'
	)

	if (shouldCreatePreview(payload)) {
		await createPreviewDeployment({
			projectId: project.id,
			prNumber: payload.number,
			branch: payload.pull_request.head.ref,
			commitSha: payload.pull_request.head.sha,
			prTitle: payload.pull_request.title,
			prUrl: payload.pull_request.html_url,
		})
	} else if (shouldCleanupPreview(payload)) {
		await cleanupPreviewDeployment(project.id, payload.number)
	}
}
