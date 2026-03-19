import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { appendFileSync } from 'node:fs'
import { Command } from 'commander'
import { getRepoRoot, listAppDirectories } from '../helpers/repo.ts'
import { createCIDeployCommand } from './ci-deploy.ts'
import {
	createCommitStatus,
	createDeployment,
	createDeploymentStatus,
	createWorkflowDispatch,
	getCombinedCommitStatus,
	listDeployments,
	listDeploymentStatuses,
	listPullRequestFiles,
	parseOptionalInt,
	parseRepo,
	type Deployment,
} from '../helpers/github.ts'

export function createCICommand(): Command {
	const cli = new Command('ci')
	cli.description('CI utilities')

	const previewCmd = new Command('preview')
	previewCmd.description('Preview deployment operations')
	previewCmd
		.command('create', 'Create preview deployments')
		.action(async () => {
			const options = parseCreatePreviewArgs(process.argv.slice(4))
			await createPreviews(options)
		})

	previewCmd
		.command('cleanup', 'Cleanup preview deployments')
		.action(async () => {
			const options = parseCleanupArgs(process.argv.slice(4))
			await cleanupPreviews(options)
		})

	previewCmd
		.command('status', 'Update preview deployment status')
		.action(async () => {
			const options = parseStatusArgs(process.argv.slice(4))
			await updatePreviewStatus(options)
		})

	previewCmd
		.command('gate', 'Wait for preview deployments')
		.action(async () => {
			const options = parseGateArgs(process.argv.slice(4))
			await runPreviewGate(options)
		})

	const eventsCmd = new Command('events')
	eventsCmd.description('Event operations')
	eventsCmd
		.command('outputs', 'Write event outputs to GitHub Actions')
		.action(async () => {
			const options = parseOutputsArgs(process.argv.slice(5))
			await writeOutputs(options)
		})

	eventsCmd.command('normalize', 'Normalize an event file').action(async () => {
		const eventPath = parseNormalizeArgs(process.argv.slice(5))
		const normalized = normalizeEvent(eventPath)
		console.log(JSON.stringify(normalized))
	})

	const e2eCmd = new Command('e2e')
	e2eCmd.description('E2E operations')
	e2eCmd.command('status', 'Update e2e status').action(async () => {
		const options = parseE2EStatusArgs(process.argv.slice(5))
		await updateE2eStatus(options)
	})

	const deployCmd = createCIDeployCommand()

	cli.addCommand(previewCmd)
	cli.addCommand(eventsCmd)
	cli.addCommand(e2eCmd)
	cli.addCommand(deployCmd)

	return cli
}

function selectRequiredApps(input: {
	allApps: string[]
	changedFiles: string[]
}): string[] {
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

async function createPreviews(options: CreatePreviewOptions): Promise<void> {
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

async function cleanupPreviews(options: CleanupOptions): Promise<void> {
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

async function updatePreviewStatus(options: StatusOptions): Promise<void> {
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

async function runPreviewGate(options: GateOptions): Promise<void> {
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

function normalizeDeployReadyEvent(
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
				? 'githubdeployment-status'
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
	if (value === 'production') return 'stable'
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

type OutputsOptions = {
	eventPath: string
	outputPath: string
}

function parseOutputsArgs(args: string[]): OutputsOptions {
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

async function writeOutputs(options: OutputsOptions): Promise<void> {
	const normalized = normalizeDeployReadyEvent(
		JSON.parse(
			await readFile(options.eventPath, 'utf8'),
		) as GitHubDispatchEnvelope,
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

	appendFileSync(options.outputPath, `${lines.join('\n')}\n`, 'utf8')
}

function parseNormalizeArgs(args: string[]): string {
	const eventPath = args[0]
	if (!eventPath) {
		throw new Error('Usage: events normalize <event-file>')
	}
	return eventPath
}

function normalizeEvent(eventPath: string): NormalizedDeployReadyEvent {
	const event = JSON.parse(
		readFileSync(eventPath, 'utf8'),
	) as GitHubDispatchEnvelope
	return normalizeDeployReadyEvent(event)
}

type E2EStatusOptions = {
	command: 'mark-pending' | 'mark-terminal'
	app: string
	prNumber: number | null
	repository: string
	runUrl: string
	sha: string
	source: string
	result: 'success' | 'failure' | null
}

function parseE2EStatusArgs(args: string[]): E2EStatusOptions {
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

async function e2eRequiredApps(input: {
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

function selectE2ERequiredApps(input: {
	allApps: string[]
	app: string
	changedFiles: string[]
	prNumber: number | null
	source: string
}): string[] {
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

async function updateE2eStatus(options: E2EStatusOptions): Promise<void> {
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
			state: options.result!,
			targetUrl: options.runUrl,
		})
	}

	const apps = await e2eRequiredApps({
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
