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
		const eventPath = rawArgs[0]
		if (!eventPath) {
			throw new Error('Usage: events normalize <event-file>')
		}
		const event = JSON.parse(
			readFileSync(eventPath, 'utf8'),
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
