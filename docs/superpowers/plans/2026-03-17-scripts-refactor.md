# Scripts Refactoring Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development
> (if subagents available) or superpowers:executing-plans to implement this
> plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up and modernize the @scripts/ folder by removing dead code,
consolidating actions into chunky modules, and adding unit tests for business
logic.

**Architecture:**

- Remove Ralph (dead code)
- Consolidate 9 action files into 3: preview.ts, e2e.ts, events.ts
- Extract shared utilities (GitHub client, argument parsing)
- Add unit tests for pure functions only

**Tech Stack:** TypeScript, Vitest, zx, cac (CLI)

---

## File Structure

### Current Structure

```
scripts/src/
├── aamini.ts                    # Main CLI (keep)
├── pm.ts                        # Task manager (keep)
├── ralph.ts                     # TO DELETE
├── e2e.ts                       # Merge into e2e.ts
├── build.ts                     # Keep (separate concern)
├── k8secrets.ts                 # Keep (separate concern)
├── deploy-ready.ts              # Move to events/
├── publish-gitops.ts            # Keep (separate concern)
├── helpers/
│   └── repo.ts                  # Keep + expand
├── actions/
│   ├── github-api.ts            # Keep (good abstraction)
│   ├── preview-deployments.ts   # → preview.ts
│   ├── preview-cleanup.ts       # → preview.ts
│   ├── preview-deployment-status.ts # → preview.ts
│   ├── preview-gate.ts          # → preview.ts
│   ├── preview-required-apps.ts # → preview.ts (merge with e2e version)
│   ├── e2e-commit-status.ts     # → e2e.ts
│   ├── e2e-required-apps.ts     # → e2e.ts (merge with preview version)
│   └── deploy-ready-outputs.ts  # → events.ts
```

### Target Structure

```
scripts/src/
├── aamini.ts                    # Main CLI
├── pm.ts                        # Task manager
├── e2e.ts                       # E2E workflow (consolidated)
├── build.ts                     # Docker build/push
├── k8secrets.ts                 # K8s secrets
├── publish-gitops.ts            # GitOps rendering
├── helpers/
│   └── repo.ts                  # Repo utilities
├── github.ts                    # GitHub API client (from actions/)
├── events/
│   ├── index.ts                 # Event types + normalizeDeployReadyEvent
│   ├── deploy-ready.ts          # Parsing + outputs
│   └── preview-gate.ts          # Gate logic
├── preview/
│   ├── index.ts                 # All preview deployment logic
│   └── required-apps.ts         # App selection logic (shared with e2e)
└── e2e-workflow/
    └── index.ts                 # E2E status logic
```

---

## Tasks

### Task 1: Remove Ralph (dead code)

**Files:**

- Delete: `scripts/src/ralph.ts`

- [ ] **Step 1: Remove Ralph file**

```bash
rm scripts/src/ralph.ts
```

- [ ] **Step 2: Remove Ralph command from CLI**

Modify: `scripts/src/aamini.ts:64-68`

Remove:

```typescript
cli
	.command('ralph <task-id>', 'Run Ralph workflow for task')
	.action(async (taskId: string) => {
		const interactive = $({ stdio: 'inherit' })
		await interactive`node --experimental-strip-types ${path.resolve(scriptDir, 'ralph.ts')} ${taskId}`
	})
```

- [ ] **Step 3: Commit**

```bash
git add scripts/src/ralph.ts scripts/src/aamini.ts
git commit -m "refactor: remove Ralph (dead code)"
```

---

### Task 2: Create shared GitHub client module

**Files:**

- Create: `scripts/src/github.ts` (from actions/github-api.ts)
- Modify: `scripts/src/actions/` (update imports)

- [ ] **Step 1: Create github.ts with GitHub API client**

Create: `scripts/src/github.ts`

```typescript
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
```

- [ ] **Step 2: Update action files to import from github.ts**

Modify imports in:

- `scripts/src/actions/preview-deployments.ts`
- `scripts/src/actions/preview-cleanup.ts`
- `scripts/src/actions/preview-deployment-status.ts`
- `scripts/src/actions/preview-gate.ts`
- `scripts/src/actions/e2e-commit-status.ts`
- `scripts/src/actions/deploy-ready-outputs.ts`

Change:

```typescript
import { ... } from './github-api.ts'
```

To:

```typescript
import { ... } from '../github.ts'
```

- [ ] **Step 3: Commit**

```bash
git add scripts/src/github.ts scripts/src/actions/
git commit -m "refactor: extract GitHub client to shared module"
```

---

### Task 3: Consolidate preview actions into chunky module

**Files:**

- Create: `scripts/src/preview/index.ts`
- Delete: `scripts/src/actions/preview-*.ts` (5 files)

- [ ] **Step 1: Create preview/index.ts with all preview logic**

Create: `scripts/src/preview/index.ts`

```typescript
#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import {
	createDeployment,
	createDeploymentStatus,
	createWorkflowDispatch,
	createCommitStatus,
	getCombinedCommitStatus,
	listDeployments,
	listDeploymentStatuses,
	listPullRequestFiles,
	parseRepo,
	parseOptionalInt,
	getRepoRoot,
	type RepoRef,
	type Deployment,
} from '../github.ts'
import { listAppDirectories } from '../helpers/repo.ts'

// ============================================================================
// SHARED: App Selection Logic
// ============================================================================

export type SelectRequiredAppsInput = {
	allApps: string[]
	changedFiles: string[]
}

export function selectRequiredApps(input: SelectRequiredAppsInput): string[] {
	const allApps = [...input.allApps].sort()
	const selected = new Set<string>()

	for (const file of input.changedFiles) {
		const match = /^apps\/([^/]+)\//.exec(file)
		if (!match) {
			return allApps
		}

		const app = match[1]
		if (app) {
			selected.add(app)
		}
	}

	if (selected.size === 0) {
		return allApps
	}

	return [...selected].sort()
}

// ============================================================================
// PREVIEW: Create Deployments
// ============================================================================

type CreatePreviewOptions = {
	prNumber: number
	repository: string
	runUrl: string
	sha: string
	workflowRef: string
}

function parseCreatePreviewArgs(args: string[]): CreatePreviewOptions {
	const values: Record<string, string> = {}
	for (let index = 0; index < args.length; index += 2) {
		const key = args[index]
		const value = args[index + 1]
		if (!key?.startsWith('--') || value === undefined) {
			throw new Error(
				'Usage: preview create --repository <owner/repo> --sha <sha> --pr-number <number> --run-url <url> --workflow-ref <ref>',
			)
		}
		values[key.slice(2)] = value
	}

	const prNumber = Number(values['pr-number'])
	if (!Number.isInteger(prNumber) || prNumber < 1) {
		throw new Error(`Invalid --pr-number value: ${values['pr-number'] ?? ''}`)
	}

	if (
		!values.repository ||
		!values.sha ||
		!values['run-url'] ||
		!values['workflow-ref']
	) {
		throw new Error('Missing required arguments')
	}

	return {
		prNumber,
		repository: values.repository,
		runUrl: values['run-url'],
		sha: values.sha,
		workflowRef: values['workflow-ref'],
	}
}

export async function createPreviews(rawArgs: string[]): Promise<void> {
	const options = parseCreatePreviewArgs(rawArgs)
	const repo = parseRepo(options.repository)
	const repoRoot = await getRepoRoot()
	const allApps = listAppDirectories(repoRoot).sort()
	const changedFiles = await listPullRequestFiles({
		prNumber: options.prNumber,
		repo,
	})
	const requiredApps = selectRequiredApps({ allApps, changedFiles })

	const imageTag = `pr-${options.prNumber}`
	for (const app of requiredApps) {
		const environment = `preview/pr-${options.prNumber}/${app}`
		const url = `https://${app}-pr-${options.prNumber}.ariaamini.com`
		const deploymentId = await createDeployment({
			environment,
			payload: {
				app,
				environment,
				image_tag: imageTag,
				pr_number: options.prNumber,
				sha: options.sha,
				url,
			},
			repo,
			sha: options.sha,
			task: 'preview-app',
		})

		await createDeploymentStatus({
			deploymentId,
			description: `Preview deployment queued for ${app}`,
			environmentUrl: url,
			logUrl: options.runUrl,
			repo,
			state: 'queued',
		})

		await createWorkflowDispatch({
			repo,
			workflowId: 'e2e-on-deploy-ready.yml',
			ref: options.workflowRef,
			inputs: {
				app,
				environment: 'preview',
				url,
				sha: options.sha,
				pr_number: String(options.prNumber),
				image_tag: imageTag,
			},
		})

		console.log(`Created deployment ${deploymentId} for ${environment}`)
	}
}

// ============================================================================
// PREVIEW: Cleanup (closed PR)
// ============================================================================

type CleanupOptions = {
	eventName: string
	eventPath: string
	repository: string
	runUrl: string
}

function parseCleanupArgs(args: string[]): CleanupOptions {
	const values: Record<string, string> = {}
	for (let index = 0; index < args.length; index += 2) {
		const key = args[index]
		const value = args[index + 1]
		if (!key?.startsWith('--') || value === undefined) {
			throw new Error(
				'Usage: preview cleanup --repository <owner/repo> --event-name <name> --event-path <path> --run-url <url>',
			)
		}
		values[key.slice(2)] = value
	}

	if (
		!values.repository ||
		!values['event-name'] ||
		!values['event-path'] ||
		!values['run-url']
	) {
		throw new Error('Missing required arguments')
	}

	return {
		eventName: values['event-name'],
		eventPath: values['event-path'],
		repository: values.repository,
		runUrl: values['run-url'],
	}
}

type PullRequestEvent = {
	action?: string
	number?: number
	pull_request?: { number: number; state: string }
}

function parseEventInput(input: {
	event: PullRequestEvent
	eventName: string
}): { prNumber: number | null; shouldCleanup: boolean } {
	if (input.eventName !== 'pull_request') {
		return { prNumber: null, shouldCleanup: false }
	}

	const action = input.event.action
	const prNumber = input.event.number ?? input.event.pull_request?.number

	if (!prNumber) {
		return { prNumber: null, shouldCleanup: false }
	}

	return { prNumber, shouldCleanup: action === 'closed' }
}

export async function cleanupPreviews(rawArgs: string[]): Promise<void> {
	const options = parseCleanupArgs(rawArgs)
	const event = JSON.parse(
		readFileSync(options.eventPath, 'utf8'),
	) as PullRequestEvent
	const parsed = parseEventInput({ event, eventName: options.eventName })

	if (!parsed.shouldCleanup) {
		console.log('Event is not a closed PR; skipping cleanup.')
		return
	}

	if (!parsed.prNumber) {
		throw new Error('Missing PR number in pull_request event')
	}

	const repo = parseRepo(options.repository)
	const deployments = await listDeployments({ repo })
	let cleaned = 0

	for (const deployment of deployments) {
		const env = deployment.environment ?? ''
		if (!env.startsWith(`preview/pr-${parsed.prNumber}/`)) {
			continue
		}

		await createDeploymentStatus({
			deploymentId: deployment.id,
			description: 'Preview environment cleaned up (PR closed)',
			environmentUrl: '',
			logUrl: options.runUrl,
			repo,
			state: 'inactive',
		})

		console.log(`Marked deployment ${deployment.id} (${env}) as inactive`)
		cleaned++
	}

	console.log(`Cleaned up ${cleaned} deployment(s) for PR #${parsed.prNumber}`)
}

// ============================================================================
// PREVIEW: Deployment Status Updates
// ============================================================================

type StatusOptions = {
	command: 'mark-in-progress' | 'mark-terminal'
	app: string
	deploymentEnvironment: string | null
	deploymentId: number | null
	environmentType: 'preview' | 'stable'
	prNumber: number | null
	repository: string
	runUrl: string
	sha: string
	url: string
	githubOutput: string | null
	result: 'success' | 'failure' | null
}

function parseStatusArgs(args: string[]): StatusOptions {
	const command = args[0]
	if (command !== 'mark-in-progress' && command !== 'mark-terminal') {
		throw new Error('Usage: preview status mark-in-progress|mark-terminal ...')
	}

	const values: Record<string, string> = {}
	for (let index = 1; index < args.length; index += 2) {
		const key = args[index]
		const value = args[index + 1]
		if (!key?.startsWith('--') || value === undefined) {
			throw new Error('Invalid argument list')
		}
		values[key.slice(2)] = value
	}

	const environmentType = values['environment-type']
	if (environmentType !== 'preview' && environmentType !== 'stable') {
		throw new Error(`Invalid --environment-type: ${environmentType}`)
	}

	if (
		!values.repository ||
		!values.sha ||
		!values.app ||
		!values.url ||
		!values['run-url']
	) {
		throw new Error('Missing required arguments')
	}

	return {
		command,
		app: values.app,
		deploymentEnvironment: values['deployment-environment'] ?? null,
		deploymentId: parseOptionalInt(values['deployment-id']),
		environmentType,
		prNumber: parseOptionalInt(values['pr-number']),
		repository: values.repository,
		runUrl: options.runUrl,
		sha: values.sha,
		url: values.url,
		githubOutput: values['github-output'] ?? null,
		result: values.result as 'success' | 'failure' | null,
	}
}

function newestDeploymentId(deployments: Deployment[]): number | null {
	const matches = deployments
		.filter((d) => d.task === 'preview-app')
		.sort((left, right) => left.created_at.localeCompare(right.created_at))
	return matches.at(-1)?.id ?? null
}

async function resolveDeploymentId(
	options: StatusOptions,
): Promise<number | null> {
	if (options.deploymentId) return options.deploymentId
	if (options.environmentType !== 'preview' || !options.deploymentEnvironment)
		return null

	const repo = parseRepo(options.repository)
	const deployments = await listDeployments({
		environment: options.deploymentEnvironment,
		repo,
		sha: options.sha,
	})
	return newestDeploymentId(deployments)
}

export async function updatePreviewStatus(rawArgs: string[]): Promise<void> {
	const options = parseStatusArgs(rawArgs)
	const repo = parseRepo(options.repository)
	const deploymentId = await resolveDeploymentId(options)

	if (!deploymentId) {
		console.log(
			`No deployment record resolved for ${options.app}; skipping status update.`,
		)
		return
	}

	const state =
		options.command === 'mark-in-progress' ? 'in_progress' : options.result!
	const description =
		options.command === 'mark-in-progress'
			? `Running deployment e2e for ${options.app}`
			: options.result === 'success'
				? `Deployment e2e passed for ${options.app}`
				: `Deployment e2e failed for ${options.app}`

	await createDeploymentStatus({
		deploymentId,
		description,
		environmentUrl: options.url,
		logUrl: options.runUrl,
		repo,
		state,
	})
}

// ============================================================================
// PREVIEW: Gate (wait for deployments)
// ============================================================================

type GateOptions = {
	eventName: string
	eventPath: string
	repository: string
	runUrl: string
	timeoutSeconds: number
}

function parseGateArgs(args: string[]): GateOptions {
	const values: Record<string, string> = {}
	for (let index = 0; index < args.length; index += 2) {
		const key = args[index]
		const value = args[index + 1]
		if (!key?.startsWith('--') || value === undefined) {
			throw new Error(
				'Usage: preview gate --repository <owner/repo> --event-name <name> --event-path <path> --run-url <url> --timeout-seconds <seconds>',
			)
		}
		values[key.slice(2)] = value
	}

	const timeoutSeconds = Number(values['timeout-seconds'])
	if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 1) {
		throw new Error(`Invalid --timeout-seconds: ${values['timeout-seconds']}`)
	}

	return {
		eventName: values['event-name'],
		eventPath: values['event-path'],
		repository: values.repository,
		runUrl: values['run-url'],
		timeoutSeconds,
	}
}

type DeploymentEvent = {
	deployment?: {
		environment?: string
		payload?: { pr_number?: number }
		sha?: string
	}
	inputs?: { pr_number?: string; sha?: string }
}

function parseGateEvent(input: { event: DeploymentEvent; eventName: string }): {
	prNumber: number | null
	sha: string | null
	skip: boolean
} {
	if (input.eventName === 'deployment_status') {
		const environment = input.event.deployment?.environment ?? ''
		if (!environment.startsWith('preview/pr-')) {
			return { prNumber: null, sha: null, skip: true }
		}

		const sha = input.event.deployment?.sha ?? null
		const payloadPr = input.event.deployment?.payload?.pr_number
		if (typeof payloadPr === 'number') {
			return { prNumber: payloadPr, sha, skip: false }
		}

		const match = /^preview\/pr-(\d+)\//.exec(environment)
		return match
			? { prNumber: Number(match[1]), sha, skip: false }
			: { prNumber: null, sha, skip: false }
	}

	const sha = input.event.inputs?.sha ?? null
	const prNumber = input.event.inputs?.pr_number
	if (!prNumber) return { prNumber: null, sha, skip: false }

	const parsedPr = Number(prNumber)
	return {
		prNumber: Number.isInteger(parsedPr) && parsedPr > 0 ? parsedPr : null,
		sha,
		skip: false,
	}
}

export async function runPreviewGate(rawArgs: string[]): Promise<void> {
	const options = parseGateArgs(rawArgs)
	const event = JSON.parse(
		readFileSync(options.eventPath, 'utf8'),
	) as DeploymentEvent
	const parsed = parseGateEvent({ event, eventName: options.eventName })

	if (parsed.skip) {
		console.log('Event is not for a preview deployment; skipping gate update.')
		return
	}

	if (!parsed.sha || !parsed.prNumber) {
		throw new Error(`Missing required gate metadata`)
	}

	const repo = parseRepo(options.repository)
	const repoRoot = await getRepoRoot()
	const allApps = listAppDirectories(repoRoot).sort()
	const changedFiles = await listPullRequestFiles({
		prNumber: parsed.prNumber,
		repo,
	})
	const requiredApps = selectRequiredApps({ allApps, changedFiles })

	let gateState: 'pending' | 'success' | 'failure' = 'success'
	let gateDescription = 'All required preview deployments are successful.'
	const pendingDetails: string[] = []
	let oldestPendingEpoch: number | null = null

	for (const app of requiredApps) {
		const environment = `preview/pr-${parsed.prNumber}/${app}`
		const deployments = await listDeployments({
			environment,
			repo,
			sha: parsed.sha,
		})
		const deployment = deployments
			.filter((d) => d.task === 'preview-app')
			.sort((l, r) => l.created_at.localeCompare(r.created_at))
			.pop()

		if (!deployment) {
			gateState = 'pending'
			pendingDetails.push(`${app}:missing-deployment`)
			continue
		}

		const latestStatus = (
			await listDeploymentStatuses({ deploymentId: deployment.id, repo })
		)[0]?.state
		const deploymentState = latestStatus ?? 'missing'

		if (deploymentState === 'success') continue

		if (deploymentState === 'failure' || deploymentState === 'error') {
			gateState = 'failure'
			gateDescription = `Preview deployment failed for ${app}.`
			break
		}

		if (
			['queued', 'in_progress', 'pending', 'missing'].includes(deploymentState)
		) {
			gateState = 'pending'
			pendingDetails.push(`${app}:${deploymentState}`)
			const createdEpoch = Date.parse(deployment.created_at)
			if (
				Number.isFinite(createdEpoch) &&
				(oldestPendingEpoch === null || createdEpoch < oldestPendingEpoch)
			) {
				oldestPendingEpoch = createdEpoch
			}
			continue
		}

		gateState = 'failure'
		gateDescription = `Unexpected deployment state '${deploymentState}' for ${app}.`
		break
	}

	if (gateState === 'pending') {
		const summary = pendingDetails.join(', ')
		if (oldestPendingEpoch !== null) {
			const pendingAgeSeconds = Math.floor(
				(Date.now() - oldestPendingEpoch) / 1000,
			)
			if (pendingAgeSeconds > options.timeoutSeconds) {
				gateState = 'failure'
				gateDescription = `Preview deployment gate timed out after ${pendingAgeSeconds}s (${summary}).`
			} else {
				gateDescription = `Waiting for required preview deployments (${summary}).`
			}
		} else {
			gateDescription = `Waiting for required preview deployments (${summary}).`
		}
	}

	await createCommitStatus({
		context: 'deployments/preview-gate',
		description: gateDescription,
		repo,
		sha: parsed.sha,
		state: gateState,
		targetUrl: options.runUrl,
	})

	console.log(
		`Published deployments/preview-gate=${gateState} for sha ${parsed.sha}.`,
	)
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main(): Promise<void> {
	const subcommand = process.argv.slice(2)[0]
	const rawArgs = process.argv.slice(3)

	if (subcommand === 'create') {
		await createPreviews(rawArgs)
	} else if (subcommand === 'cleanup') {
		await cleanupPreviews(rawArgs)
	} else if (subcommand === 'status') {
		await updatePreviewStatus(rawArgs)
	} else if (subcommand === 'gate') {
		await runPreviewGate(rawArgs)
	} else {
		throw new Error('Usage: preview <create|cleanup|status|gate> ...')
	}
}

if (process.argv[1] === import.meta.url.replace('file://', '')) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : error)
		process.exit(1)
	})
}
```

- [ ] **Step 2: Delete old preview action files**

```bash
rm scripts/src/actions/preview-deployments.ts
rm scripts/src/actions/preview-cleanup.ts
rm scripts/src/actions/preview-deployment-status.ts
rm scripts/src/actions/preview-gate.ts
rm scripts/src/actions/preview-required-apps.ts
```

- [ ] **Step 3: Commit**

```bash
git add scripts/src/preview/ scripts/src/actions/
git commit -m "refactor: consolidate preview actions into chunky module"
```

---

### Task 4: Consolidate e2e actions

**Files:**

- Create: `scripts/src/e2e-workflow/index.ts`
- Delete: `scripts/src/actions/e2e-commit-status.ts`,
  `scripts/src/actions/e2e-required-apps.ts`

- [ ] **Step 1: Create e2e-workflow/index.ts**

Create: `scripts/src/e2e-workflow/index.ts`

```typescript
#!/usr/bin/env node

import { getRepoRoot, listAppDirectories } from '../helpers/repo.ts'
import {
	createCommitStatus,
	getCombinedCommitStatus,
	listPullRequestFiles,
	parseRepo,
	parseOptionalInt,
	type RepoRef,
} from '../github.ts'
import { selectRequiredApps } from '../preview/index.ts'

// ============================================================================
// E2E: Required Apps Selection (uses preview logic)
// ============================================================================

export type SelectE2ERequiredAppsInput = {
	allApps: string[]
	app: string
	changedFiles: string[]
	prNumber: number | null
	source: string
}

export function selectE2ERequiredApps(
	input: SelectE2ERequiredAppsInput,
): string[] {
	const allApps = [...input.allApps].sort()

	if (input.prNumber === null) {
		if (input.source === 'flux-deploy-ready') {
			return allApps
		}
		return [input.app]
	}

	const selected = new Set<string>()
	for (const file of input.changedFiles) {
		const match = /^apps\/([^/]+)\//.exec(file)
		if (!match) {
			return allApps
		}

		const app = match[1]
		if (app) {
			selected.add(app)
		}
	}

	if (selected.size === 0) {
		return allApps
	}

	return [...selected].sort()
}

// ============================================================================
// E2E: Commit Status
// ============================================================================

type StatusOptions = {
	command: 'mark-pending' | 'mark-terminal'
	app: string
	prNumber: number | null
	repository: string
	runUrl: string
	sha: string
	source: string
	result: 'success' | 'failure' | null
}

function parseStatusArgs(args: string[]): StatusOptions {
	const command = args[0]
	if (command !== 'mark-pending' && command !== 'mark-terminal') {
		throw new Error('Usage: e2e status mark-pending|mark-terminal ...')
	}

	const values: Record<string, string> = {}
	for (let index = 1; index < args.length; index += 2) {
		const key = args[index]
		const value = args[index + 1]
		if (!key?.startsWith('--') || value === undefined) {
			throw new Error('Invalid argument list')
		}
		values[key.slice(2)] = value
	}

	if (
		!values.repository ||
		!values.sha ||
		!values.app ||
		!values.source ||
		!values['run-url']
	) {
		throw new Error('Missing required arguments')
	}

	return {
		command,
		app: values.app,
		prNumber: parseOptionalInt(values['pr-number']),
		repository: values.repository,
		runUrl: values['run-url'],
		sha: values.sha,
		source: values.source,
		result: values.result as 'success' | 'failure' | null,
	}
}

async function requiredApps(input: {
	app: string
	prNumber: number | null
	repoRoot: string
	repository: string
	source: string
}): Promise<string[]> {
	const allApps = listAppDirectories(input.repoRoot)
	const changedFiles =
		input.prNumber === null
			? []
			: await listPullRequestFiles({
					prNumber: input.prNumber,
					repo: parseRepo(input.repository),
				})

	return selectE2ERequiredApps({
		allApps,
		app: input.app,
		changedFiles,
		prNumber: input.prNumber,
		source: input.source,
	})
}

async function computeAggregateState(input: {
	requiredApps: string[]
	repository: string
	sha: string
}): Promise<'pending' | 'success' | 'failure'> {
	const combined = await getCombinedCommitStatus({
		repo: parseRepo(input.repository),
		sha: input.sha,
	})

	let hasPending = false
	for (const app of input.requiredApps) {
		const context = `e2e/${app}`
		const latest = combined.statuses.find((s) => s.context === context)
		const state = latest?.state ?? 'missing'

		if (state === 'failure' || state === 'error') {
			return 'failure'
		}

		if (state === 'pending' || state === 'missing') {
			hasPending = true
		}
	}

	return hasPending ? 'pending' : 'success'
}

export async function updateE2eStatus(rawArgs: string[]): Promise<void> {
	const options = parseStatusArgs(rawArgs)
	const repo = parseRepo(options.repository)
	const repoRoot = await getRepoRoot()
	const e2eContext = `e2e/${options.app}`

	if (options.command === 'mark-pending') {
		await createCommitStatus({
			context: e2eContext,
			description: `Waiting for deployed ${options.app} e2e`,
			repo,
			sha: options.sha,
			state: 'pending',
			targetUrl: options.runUrl,
		})
	} else {
		await createCommitStatus({
			context: e2eContext,
			description:
				options.result === 'success'
					? `Deployment e2e passed for ${options.app}`
					: `Deployment e2e failed for ${options.app}`,
			repo,
			sha: options.sha,
			state: options.result,
			targetUrl: options.runUrl,
		})
	}

	const apps = await requiredApps({
		app: options.app,
		prNumber: options.prNumber,
		repoRoot,
		repository: options.repository,
		source: options.source,
	})
	const aggregate = await computeAggregateState({
		requiredApps: apps,
		repository: options.repository,
		sha: options.sha,
	})
	await createCommitStatus({
		context: 'e2e/all-required',
		description:
			aggregate === 'pending'
				? 'Waiting for required deployment e2e'
				: 'Aggregate deployment e2e status',
		repo,
		sha: options.sha,
		state: aggregate,
		targetUrl: options.runUrl,
	})
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main(): Promise<void> {
	const subcommand = process.argv.slice(2)[0]
	const rawArgs = process.argv.slice(3)

	if (subcommand === 'status') {
		await updateE2eStatus(rawArgs)
	} else {
		throw new Error('Usage: e2e-workflow status ...')
	}
}

if (process.argv[1] === import.meta.url.replace('file://', '')) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : error)
		process.exit(1)
	})
}
```

- [ ] **Step 2: Delete old e2e action files**

```bash
rm scripts/src/actions/e2e-commit-status.ts
rm scripts/src/actions/e2e-required-apps.ts
```

- [ ] **Step 3: Commit**

```bash
git add scripts/src/e2e-workflow/ scripts/src/actions/
git commit -m "refactor: consolidate e2e actions into chunky module"
```

---

### Task 5: Create events module

**Files:**

- Create: `scripts/src/events/index.ts` (consolidate deploy-ready.ts +
  deploy-ready-outputs.ts)
- Delete: `scripts/src/actions/deploy-ready-outputs.ts`

- [ ] **Step 1: Create events/index.ts**

Create: `scripts/src/events/index.ts`

```typescript
#!/usr/bin/env node

import { appendFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'

// ============================================================================
// Event Types (from deploy-ready.ts)
// ============================================================================

export type GitHubDispatchEnvelope = {
	action?: string
	client_payload?: {
		app?: string
		deployment_id?: number | string
		environment?: string
		image_tag?: string
		involvedObject?: { kind?: string; name?: string; namespace?: string }
		metadata?: Record<string, string>
		pr_number?: number | string
		sha?: string
		source?: string
		url?: string
	}
	inputs?: {
		app?: string
		deployment_id?: string
		environment?: string
		image_tag?: string
		pr_number?: string
		sha?: string
		url?: string
	}
	deployment?: {
		id?: number | string
		environment?: string
		payload?: {
			app?: string
			deployment_environment?: string
			environment?: string
			image_tag?: string
			pr_number?: number | string
			sha?: string
			source?: string
			url?: string
		}
		sha?: string
	}
	deployment_status?: {
		environment_url?: string
		state?: string
	}
}

export type NormalizedDeployReadyEvent = {
	app: string
	deploymentEnvironment: string
	deploymentId: number | null
	environmentType: 'preview' | 'stable'
	eventType: string
	imageTag: string
	prNumber: number | null
	sha: string
	source: string
	url: string
}

// ============================================================================
// Normalization Logic (from deploy-ready.ts)
// ============================================================================

export function normalizeDeployReadyEvent(
	event: GitHubDispatchEnvelope,
): NormalizedDeployReadyEvent {
	const payload = event.client_payload ?? {}
	const deploymentPayload = event.deployment?.payload ?? {}
	const metadata = payload.metadata ?? {}
	const involvedObject = payload.involvedObject ?? {}
	const inputs = event.inputs ?? {}

	const app =
		payload.app ??
		deploymentPayload.app ??
		metadata.app ??
		inputs.app ??
		deriveAppName(involvedObject.name)
	if (!app) {
		throw new Error('Missing deploy-ready app in dispatch payload')
	}

	const environment = normalizeEnvironment(
		payload.environment ??
			deploymentPayload.environment ??
			metadata.environment ??
			inputs.environment ??
			deriveEnvironmentFromDeploymentName(event.deployment?.environment) ??
			(involvedObject.namespace === 'app-preview' ? 'preview' : 'stable'),
	)

	const url =
		event.deployment_status?.environment_url ??
		payload.url ??
		deploymentPayload.url ??
		metadata.url ??
		inputs.url
	if (!url) {
		throw new Error('Missing deploy-ready URL in dispatch payload')
	}

	const sha =
		payload.sha ??
		deploymentPayload.sha ??
		event.deployment?.sha ??
		metadata.sha ??
		metadata.commit ??
		inputs.sha
	if (!sha) {
		throw new Error('Missing deploy-ready SHA in dispatch payload')
	}

	const imageTag =
		payload.image_tag ??
		deploymentPayload.image_tag ??
		metadata.image_tag ??
		inputs.image_tag ??
		(environment === 'preview'
			? derivePreviewImageTag(app, involvedObject.name, metadata.change_request)
			: `main-${sha}`)

	const prNumber = normalizePrNumber(
		payload.pr_number ??
			deploymentPayload.pr_number ??
			metadata.pr_number ??
			metadata.change_request ??
			derivePrNumberFromDeploymentName(event.deployment?.environment) ??
			inputs.pr_number,
	)

	const deploymentId = normalizeDeploymentId(
		payload.deployment_id ??
			metadata.deployment_id ??
			event.deployment?.id ??
			inputs.deployment_id,
	)

	const deploymentEnvironment = deriveDeploymentEnvironment({
		app,
		environment,
		prNumber,
		...(metadata.deployment_environment
			? { explicitValue: metadata.deployment_environment }
			: deploymentPayload.deployment_environment
				? { explicitValue: deploymentPayload.deployment_environment }
				: {}),
	})

	return {
		app,
		deploymentEnvironment,
		deploymentId,
		environmentType: environment,
		eventType: event.action ?? 'app_deploy_ready',
		imageTag,
		prNumber,
		sha,
		source:
			payload.source ??
			deploymentPayload.source ??
			metadata.source ??
			(event.deployment_status
				? 'github-deployment-status'
				: 'flux-deploy-ready'),
		url,
	}
}

function deriveEnvironmentFromDeploymentName(
	value: string | undefined,
): 'preview' | 'stable' | undefined {
	if (!value) return undefined
	if (value.startsWith('preview/')) return 'preview'
	if (value.startsWith('stable/')) return 'stable'
	return undefined
}

function derivePrNumberFromDeploymentName(
	value: string | undefined,
): string | null {
	if (!value) return null
	return /^preview\/pr-(\d+)\//.exec(value)?.[1] ?? null
}

function deriveDeploymentEnvironment(input: {
	app: string
	explicitValue?: string
	environment: 'preview' | 'stable'
	prNumber: number | null
}): string {
	if (input.explicitValue) return input.explicitValue
	if (input.environment === 'preview') {
		if (!input.prNumber) {
			throw new Error('Missing deploy-ready PR number for preview deployment')
		}
		return `preview/pr-${input.prNumber}/${input.app}`
	}
	return `stable/${input.app}`
}

function deriveAppName(name?: string): string | undefined {
	if (!name) return undefined
	return name.replace(/-pr-\d+$/, '')
}

function derivePreviewImageTag(
	app: string,
	name?: string,
	changeRequest?: string,
): string {
	const prNumber =
		changeRequest ??
		name?.match(new RegExp(`^${escapeRegex(app)}-pr-(\\d+)$`))?.[1]
	return prNumber ? `pr-${prNumber}` : ''
}

function normalizeEnvironment(value: string): 'preview' | 'stable' {
	if (value === 'preview' || value === 'stable') return value
	throw new Error(`Unsupported deploy-ready environment: ${value}`)
}

function normalizePrNumber(value: number | string | undefined): number | null {
	if (value === undefined || value === '') return null
	const parsed = Number(value)
	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new Error(`Invalid deploy-ready PR number: ${value}`)
	}
	return parsed
}

function normalizeDeploymentId(
	value: number | string | undefined,
): number | null {
	if (value === undefined || value === '') return null
	const parsed = Number(value)
	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new Error(`Invalid deploy-ready deployment ID: ${value}`)
	}
	return parsed
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ============================================================================
// CLI: Parse Event to Outputs
// ============================================================================

type OutputsOptions = {
	eventPath: string
	outputPath: string
}

function parseArgs(args: string[]): OutputsOptions {
	const values: Record<string, string> = {}
	for (let index = 0; index < args.length; index += 2) {
		const key = args[index]
		const value = args[index + 1]
		if (!key?.startsWith('--') || value === undefined) {
			throw new Error(
				'Usage: events outputs --event-path <path> --github-output <path>',
			)
		}
		values[key.slice(2)] = value
	}

	if (!values['event-path'] || !values['github-output']) {
		throw new Error('Missing required arguments')
	}

	return {
		eventPath: values['event-path'],
		outputPath: values['github-output'],
	}
}

export async function writeOutputs(rawArgs: string[]): Promise<void> {
	const { eventPath, outputPath } = parseArgs(rawArgs)
	const normalized = normalizeDeployReadyEvent(
		JSON.parse(await readFile(eventPath, 'utf8')) as GitHubDispatchEnvelope,
	)

	const lines = [
		`app=${normalized.app}`,
		`deployment_environment=${normalized.deploymentEnvironment}`,
		`deployment_id=${normalized.deploymentId ?? ''}`,
		`environment_type=${normalized.environmentType}`,
		`event_type=${normalized.eventType}`,
		`image_tag=${normalized.imageTag}`,
		`pr_number=${normalized.prNumber ?? ''}`,
		`sha=${normalized.sha}`,
		`source=${normalized.source}`,
		`url=${normalized.url}`,
	]

	appendFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8')
}

// ============================================================================
// CLI: Main
// ============================================================================

async function main(): Promise<void> {
	const subcommand = process.argv.slice(2)[0]
	const rawArgs = process.argv.slice(3)

	if (subcommand === 'outputs') {
		await writeOutputs(rawArgs)
	} else if (subcommand === 'normalize') {
		const event = JSON.parse(
			readFileSync(rawArgs[0], 'utf8'),
		) as GitHubDispatchEnvelope
		console.log(JSON.stringify(normalizeDeployReadyEvent(event)))
	} else {
		throw new Error('Usage: events <outputs|normalize> ...')
	}
}

if (process.argv[1] === import.meta.url.replace('file://', '')) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : error)
		process.exit(1)
	})
}
```

- [ ] **Step 2: Delete old deploy-ready-outputs.ts**

```bash
rm scripts/src/actions/deploy-ready-outputs.ts
```

- [ ] **Step 3: Update tests to use new location**

Modify: `scripts/src/deploy-ready.test.ts` - update import path:

```typescript
import { normalizeDeployReadyEvent } from './events/index.ts'
```

- [ ] **Step 4: Commit**

```bash
git add scripts/src/events/ scripts/src/actions/deploy-ready-outputs.ts scripts/src/deploy-ready.test.ts
git commit -m "refactor: consolidate events module"
```

---

### Task 6: Add unit tests for pure functions

**Files:**

- Create: `scripts/src/preview/required-apps.test.ts`
- Create: `scripts/src/e2e-workflow/required-apps.test.ts`
- Create: `scripts/src/events/normalize.test.ts`

- [ ] **Step 1: Test selectRequiredApps**

Create: `scripts/src/preview/required-apps.test.ts`

```typescript
import { describe, expect, it } from 'vitest'
import { selectRequiredApps } from './index.ts'

describe('selectRequiredApps', () => {
	it('returns all apps if no files changed', () => {
		expect(
			selectRequiredApps({ allApps: ['a', 'b'], changedFiles: [] }),
		).toEqual(['a', 'b'])
	})

	it('returns all apps if file outside apps/ changed', () => {
		expect(
			selectRequiredApps({
				allApps: ['a', 'b'],
				changedFiles: ['packages/utils/index.ts'],
			}),
		).toEqual(['a', 'b'])
	})

	it('returns only affected apps', () => {
		expect(
			selectRequiredApps({
				allApps: ['a', 'b', 'c'],
				changedFiles: ['apps/a/src/index.ts'],
			}),
		).toEqual(['a'])
	})

	it('sorts results alphabetically', () => {
		expect(
			selectRequiredApps({
				allApps: ['c', 'a', 'b'],
				changedFiles: ['apps/c/src/index.ts', 'apps/a/src/index.ts'],
			}),
		).toEqual(['a', 'c'])
	})
})
```

- [ ] **Step 2: Test selectE2ERequiredApps**

Create: `scripts/src/e2e-workflow/required-apps.test.ts`

```typescript
import { describe, expect, it } from 'vitest'
import { selectE2ERequiredApps } from './index.ts'

describe('selectE2ERequiredApps', () => {
	it('returns all apps for flux-deploy-ready without PR', () => {
		expect(
			selectE2ERequiredApps({
				allApps: ['a', 'b'],
				app: 'x',
				changedFiles: [],
				prNumber: null,
				source: 'flux-deploy-ready',
			}),
		).toEqual(['a', 'b'])
	})

	it('returns single app for non-flux source without PR', () => {
		expect(
			selectE2ERequiredApps({
				allApps: ['a', 'b'],
				app: 'x',
				changedFiles: [],
				prNumber: null,
				source: 'other',
			}),
		).toEqual(['x'])
	})

	it('returns affected apps for PR', () => {
		expect(
			selectE2ERequiredApps({
				allApps: ['a', 'b', 'c'],
				app: 'x',
				changedFiles: ['apps/a/src/index.ts'],
				prNumber: 123,
				source: 'github',
			}),
		).toEqual(['a'])
	})
})
```

- [ ] **Step 3: Test normalizeDeployReadyEvent**

Create: `scripts/src/events/normalize.test.ts`

```typescript
import { describe, expect, it } from 'vitest'
import { normalizeDeployReadyEvent } from './index.ts'

describe('normalizeDeployReadyEvent', () => {
	it('normalizes basic repository_dispatch', () => {
		expect(
			normalizeDeployReadyEvent({
				action: 'app_deploy_ready',
				client_payload: {
					app: 'portfolio',
					environment: 'stable',
					sha: 'deadbeef',
					url: 'https://portfolio.ariaamini.com',
				},
			}),
		).toMatchObject({
			app: 'portfolio',
			deploymentEnvironment: 'stable/portfolio',
			environmentType: 'stable',
			sha: 'deadbeef',
		})
	})

	it('normalizes preview with PR number', () => {
		expect(
			normalizeDeployReadyEvent({
				action: 'app_deploy_ready',
				client_payload: {
					app: 'portfolio',
					environment: 'preview',
					pr_number: 139,
					sha: 'cafebabe',
					url: 'https://portfolio-pr-139.ariaamini.com',
				},
			}),
		).toMatchObject({
			app: 'portfolio',
			deploymentEnvironment: 'preview/pr-139/portfolio',
			environmentType: 'preview',
			prNumber: 139,
		})
	})

	it('throws on missing required fields', () => {
		expect(() =>
			normalizeDeployReadyEvent({
				action: 'app_deploy_ready',
				client_payload: { app: 'portfolio' },
			}),
		).toThrow('Missing deploy-ready URL')
	})
})
```

- [ ] **Step 4: Run tests**

```bash
cd scripts && pnpm test
```

- [ ] **Step 5: Commit**

```bash
git add scripts/src/preview/required-apps.test.ts scripts/src/e2e-workflow/required-apps.test.ts scripts/src/events/normalize.test.ts
git commit -m "test: add unit tests for pure functions"
```

---

### Task 7: Final cleanup and verify

- [ ] **Step 1: Remove empty actions directory if empty**

```bash
ls scripts/src/actions/
# If only github-api.ts remains, move it or leave as-is
```

- [ ] **Step 2: Run typecheck**

```bash
cd scripts && pnpm typecheck
```

- [ ] **Step 3: Run all tests**

```bash
cd scripts && pnpm test
```

- [ ] **Step 4: Commit final cleanup**

```bash
git add -A
git commit -m "refactor: complete scripts modernization"
```
