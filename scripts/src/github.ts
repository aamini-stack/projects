import { getRepoRoot } from './helpers/repo.ts'

export type RepoRef = {
	owner: string
	name: string
}

export type Deployment = {
	created_at: string
	environment: string
	id: number
	payload?: { pr_number?: number }
	sha: string
	task: string
}

export type DeploymentStatus = {
	state: string
	created_at: string
}

export type CombinedStatusResponse = {
	statuses: Array<{
		context: string
		state: 'error' | 'failure' | 'pending' | 'success'
	}>
}

export function parseRepo(repository: string): RepoRef {
	const [owner, name] = repository.split('/')
	if (!owner || !name) {
		throw new Error(`Invalid repository value: ${repository}`)
	}
	return { owner, name }
}

function getGitHubToken(): string {
	const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN
	if (!token) {
		throw new Error('Missing GH_TOKEN or GITHUB_TOKEN')
	}
	return token
}

export async function githubRequest<T>(input: {
	body?: unknown
	method?: 'GET' | 'POST'
	path: string
	query?: Record<string, number | string | undefined>
}): Promise<T> {
	const token = getGitHubToken()
	const query = new URLSearchParams()
	for (const [key, value] of Object.entries(input.query ?? {})) {
		if (value !== undefined && value !== '') {
			query.set(key, String(value))
		}
	}

	const url = `https://api.github.com${input.path}${query.size > 0 ? `?${query.toString()}` : ''}`
	const response = await fetch(url, {
		method: input.method ?? 'GET',
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			'X-GitHub-Api-Version': '2022-11-28',
		},
		...(input.body ? { body: JSON.stringify(input.body) } : {}),
	})

	if (!response.ok) {
		const details = await response.text()
		throw new Error(
			`GitHub API ${response.status} for ${input.path}: ${details || response.statusText}`,
		)
	}

	if (response.status === 204) {
		return undefined as T
	}

	return (await response.json()) as T
}

export async function listPullRequestFiles(input: {
	repo: RepoRef
	prNumber: number
}): Promise<string[]> {
	const files: string[] = []
	let page = 1

	while (true) {
		const entries = await githubRequest<Array<{ filename: string }>>({
			path: `/repos/${input.repo.owner}/${input.repo.name}/pulls/${input.prNumber}/files`,
			query: { page, per_page: 100 },
		})
		if (entries.length === 0) break

		files.push(...entries.map((entry) => entry.filename))
		if (entries.length < 100) break
		page += 1
	}

	return files
}

export async function createDeployment(input: {
	repo: RepoRef
	sha: string
	environment: string
	payload: Record<string, number | string>
	task: string
}): Promise<number> {
	const deployment = await githubRequest<{ id: number }>({
		method: 'POST',
		path: `/repos/${input.repo.owner}/${input.repo.name}/deployments`,
		body: {
			ref: input.sha,
			task: input.task,
			auto_merge: false,
			required_contexts: [],
			environment: input.environment,
			transient_environment: true,
			production_environment: false,
			payload: input.payload,
		},
	})
	return deployment.id
}

export async function createDeploymentStatus(input: {
	repo: RepoRef
	deploymentId: number
	state:
		| 'queued'
		| 'in_progress'
		| 'success'
		| 'failure'
		| 'pending'
		| 'error'
		| 'inactive'
	description: string
	environmentUrl: string
	logUrl: string
}): Promise<void> {
	await githubRequest({
		method: 'POST',
		path: `/repos/${input.repo.owner}/${input.repo.name}/deployments/${input.deploymentId}/statuses`,
		body: {
			state: input.state,
			description: input.description,
			environment_url: input.environmentUrl,
			log_url: input.logUrl,
		},
	})
}

export async function listDeployments(input: {
	repo: RepoRef
	sha?: string
	environment?: string
}): Promise<Deployment[]> {
	const query: Record<string, string> = { per_page: '100' }
	if (input.sha) query.sha = input.sha
	if (input.environment) query.environment = input.environment

	return await githubRequest<Deployment[]>({
		path: `/repos/${input.repo.owner}/${input.repo.name}/deployments`,
		query,
	})
}

export async function listDeploymentStatuses(input: {
	repo: RepoRef
	deploymentId: number
}): Promise<DeploymentStatus[]> {
	return await githubRequest<DeploymentStatus[]>({
		path: `/repos/${input.repo.owner}/${input.repo.name}/deployments/${input.deploymentId}/statuses`,
		query: { per_page: 1 },
	})
}

export async function createCommitStatus(input: {
	repo: RepoRef
	sha: string
	context: string
	state: 'pending' | 'success' | 'failure' | 'error'
	description: string
	targetUrl: string
}): Promise<void> {
	await githubRequest({
		method: 'POST',
		path: `/repos/${input.repo.owner}/${input.repo.name}/statuses/${input.sha}`,
		body: {
			state: input.state,
			context: input.context,
			description: input.description,
			target_url: input.targetUrl,
		},
	})
}

export async function createRepositoryDispatch(input: {
	repo: RepoRef
	eventType: string
	clientPayload: Record<string, number | string>
}): Promise<void> {
	await githubRequest({
		method: 'POST',
		path: `/repos/${input.repo.owner}/${input.repo.name}/dispatches`,
		body: {
			event_type: input.eventType,
			client_payload: input.clientPayload,
		},
	})
}

export async function createWorkflowDispatch(input: {
	repo: RepoRef
	workflowId: string
	ref: string
	inputs: Record<string, string>
}): Promise<void> {
	await githubRequest({
		method: 'POST',
		path: `/repos/${input.repo.owner}/${input.repo.name}/actions/workflows/${input.workflowId}/dispatches`,
		body: {
			ref: input.ref,
			inputs: input.inputs,
		},
	})
}

export async function getCombinedCommitStatus(input: {
	repo: RepoRef
	sha: string
}): Promise<CombinedStatusResponse> {
	return await githubRequest<CombinedStatusResponse>({
		path: `/repos/${input.repo.owner}/${input.repo.name}/commits/${input.sha}/status`,
	})
}

export function parseOptionalInt(value: string | undefined): number | null {
	if (!value) return null
	const parsed = Number(value)
	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new Error(`Invalid integer value: ${value}`)
	}
	return parsed
}

export { getRepoRoot }
