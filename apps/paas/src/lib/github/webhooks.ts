import { createHmac } from 'crypto'

/**
 * GitHub Webhook Management
 * Handles webhook registration, signature verification, and event routing
 */

export interface WebhookConfig {
	url: string
	secret: string
	events: string[]
	active?: boolean
}

export interface GitHubWebhookResponse {
	id: number
	url: string
	test_url: string
	ping_url: string
	active: boolean
	events: string[]
	config: {
		url: string
		content_type: string
		insecure_ssl: string
	}
}

/**
 * Creates a webhook for a GitHub repository
 * @param repoOwner - Repository owner username
 * @param repoName - Repository name
 * @param accessToken - GitHub access token with repo:hook scope
 * @param config - Webhook configuration
 * @returns GitHub webhook response
 */
export async function createWebhook(
	repoOwner: string,
	repoName: string,
	accessToken: string,
	config: WebhookConfig,
): Promise<GitHubWebhookResponse> {
	const url = `https://api.github.com/repos/${repoOwner}/${repoName}/hooks`

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			name: 'web',
			active: config.active ?? true,
			events: config.events,
			config: {
				url: config.url,
				content_type: 'json',
				secret: config.secret,
				insecure_ssl: '0',
			},
		}),
	})

	if (!response.ok) {
		const error = await response.json()
		throw new Error(
			`Failed to create webhook: ${error.message || response.statusText}`,
		)
	}

	return response.json()
}

/**
 * Deletes a webhook from a GitHub repository
 * @param repoOwner - Repository owner username
 * @param repoName - Repository name
 * @param webhookId - Webhook ID to delete
 * @param accessToken - GitHub access token
 */
export async function deleteWebhook(
	repoOwner: string,
	repoName: string,
	webhookId: string,
	accessToken: string,
): Promise<void> {
	const url = `https://api.github.com/repos/${repoOwner}/${repoName}/hooks/${webhookId}`

	const response = await fetch(url, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
		},
	})

	if (!response.ok && response.status !== 404) {
		throw new Error(`Failed to delete webhook: ${response.statusText}`)
	}
}

/**
 * Verifies the signature of a GitHub webhook payload
 * Uses HMAC-SHA256 to validate that the payload came from GitHub
 * @param payload - Raw webhook payload (stringified JSON)
 * @param signature - X-Hub-Signature-256 header value
 * @param secret - Webhook secret
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
	payload: string,
	signature: string,
	secret: string,
): boolean {
	if (!signature || !signature.startsWith('sha256=')) {
		return false
	}

	const expectedSignature = signature.slice(7) // Remove 'sha256=' prefix
	const hmac = createHmac('sha256', secret)
	hmac.update(payload)
	const calculatedSignature = hmac.digest('hex')

	// Use timing-safe comparison
	return timingSafeEqual(
		Buffer.from(calculatedSignature),
		Buffer.from(expectedSignature),
	)
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
	if (a.length !== b.length) {
		return false
	}

	let result = 0
	for (let i = 0; i < a.length; i++) {
		result |= a[i]! ^ b[i]!
	}
	return result === 0
}

/**
 * GitHub webhook event types
 */
export type GitHubWebhookEvent =
	| 'push'
	| 'pull_request'
	| 'pull_request_review'
	| 'deployment'
	| 'deployment_status'
	| 'delete'
	| 'create'
	| 'ping'

/**
 * Base interface for all webhook payloads
 */
export interface BaseWebhookPayload {
	action?: string
	repository: {
		id: number
		name: string
		full_name: string
		owner: {
			login: string
		}
	}
	sender: {
		login: string
		avatar_url: string
	}
}

/**
 * Push event payload
 */
export interface PushEventPayload extends BaseWebhookPayload {
	ref: string // e.g., "refs/heads/main"
	before: string // commit SHA before push
	after: string // commit SHA after push
	commits: Array<{
		id: string
		message: string
		timestamp: string
		author: {
			name: string
			email: string
		}
	}>
	head_commit: {
		id: string
		message: string
		timestamp: string
		author: {
			name: string
			email: string
		}
	}
}

/**
 * Pull request event payload
 */
export interface PullRequestEventPayload extends BaseWebhookPayload {
	action: 'opened' | 'closed' | 'reopened' | 'synchronize'
	number: number
	pull_request: {
		number: number
		title: string
		html_url: string
		head: {
			ref: string // branch name
			sha: string
		}
		base: {
			ref: string
		}
		merged: boolean
	}
}

/**
 * Extracts the branch name from a git ref
 * @param ref - Git reference (e.g., "refs/heads/main")
 * @returns Branch name (e.g., "main")
 */
export function extractBranchFromRef(ref: string): string {
	return ref.replace('refs/heads/', '')
}

/**
 * Determines if a push event should trigger a deployment
 * @param payload - Push event payload
 * @param productionBranch - The branch configured for production deployments
 * @returns true if deployment should be triggered
 */
export function shouldTriggerDeployment(
	payload: PushEventPayload,
	productionBranch: string,
): boolean {
	const branch = extractBranchFromRef(payload.ref)
	return branch === productionBranch && payload.after !== '0000000000000000000000000000000000000000'
}

/**
 * Determines if a PR event should create a preview deployment
 * @param payload - Pull request event payload
 * @returns true if preview deployment should be created
 */
export function shouldCreatePreview(
	payload: PullRequestEventPayload,
): boolean {
	return (
		payload.action === 'opened' ||
		payload.action === 'synchronize' ||
		payload.action === 'reopened'
	)
}

/**
 * Determines if a PR event should cleanup a preview deployment
 * @param payload - Pull request event payload
 * @returns true if preview deployment should be cleaned up
 */
export function shouldCleanupPreview(
	payload: PullRequestEventPayload,
): boolean {
	return payload.action === 'closed'
}
