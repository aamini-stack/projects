import { readFileSync } from 'node:fs'
import {
	createDeployment,
	createDeploymentStatus,
	createWorkflowDispatch,
	createCommitStatus,
	listDeployments,
	listDeploymentStatuses,
	listPullRequestFiles,
	parseRepo,
	parseOptionalInt,
	getRepoRoot,
	type Deployment,
} from '../github.ts'
import { listAppDirectories } from '../repo.ts'

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

type CreatePreviewOptions = {
	prNumber: number
	repository: string
	runUrl: string
	sha: string
	workflowRef: string
}

export function parseCreatePreviewArgs(args: string[]): CreatePreviewOptions {
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

type CleanupOptions = {
	eventName: string
	eventPath: string
	repository: string
	runUrl: string
}

export function parseCleanupArgs(args: string[]): CleanupOptions {
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

export function parseStatusArgs(args: string[]): StatusOptions {
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
		runUrl: values['run-url'],
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

type GateOptions = {
	eventName: string
	eventPath: string
	repository: string
	runUrl: string
	timeoutSeconds: number
}

export function parseGateArgs(args: string[]): GateOptions {
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
		eventName: values['event-name']!,
		eventPath: values['event-path']!,
		repository: values.repository!,
		runUrl: values['run-url']!,
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
