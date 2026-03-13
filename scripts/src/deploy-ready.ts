#!/usr/bin/env node

import { readFileSync } from 'node:fs'

type GitHubDispatchEnvelope = {
	action?: string
	client_payload?: {
		app?: string
		environment?: string
		image_tag?: string
		involvedObject?: {
			kind?: string
			name?: string
			namespace?: string
		}
		metadata?: Record<string, string>
		pr_number?: number | string
		sha?: string
		source?: string
		url?: string
	}
	inputs?: {
		app?: string
		environment?: string
		image_tag?: string
		pr_number?: string
		sha?: string
		url?: string
	}
}

type NormalizedDeployReadyEvent = {
	app: string
	environment: 'preview' | 'stable'
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
	const metadata = payload.metadata ?? {}
	const involvedObject = payload.involvedObject ?? {}
	const inputs = event.inputs ?? {}
	const app =
		payload.app ??
		metadata.app ??
		inputs.app ??
		deriveAppName(involvedObject.name)
	if (!app) {
		throw new Error('Missing deploy-ready app in dispatch payload')
	}

	const environment = normalizeEnvironment(
		payload.environment ??
			metadata.environment ??
			inputs.environment ??
			(involvedObject.namespace === 'app-preview' ? 'preview' : 'stable'),
	)
	const url = payload.url ?? metadata.url ?? inputs.url
	if (!url) {
		throw new Error('Missing deploy-ready URL in dispatch payload')
	}

	const sha = payload.sha ?? metadata.sha ?? metadata.commit ?? inputs.sha
	if (!sha) {
		throw new Error('Missing deploy-ready SHA in dispatch payload')
	}

	const imageTag =
		payload.image_tag ??
		metadata.image_tag ??
		inputs.image_tag ??
		(environment === 'preview'
			? derivePreviewImageTag(app, involvedObject.name, metadata.change_request)
			: `main-${sha}`)
	const prNumber = normalizePrNumber(
		payload.pr_number ??
			metadata.pr_number ??
			metadata.change_request ??
			inputs.pr_number,
	)

	return {
		app,
		environment,
		eventType: event.action ?? 'app_deploy_ready',
		imageTag,
		prNumber,
		sha,
		source: payload.source ?? metadata.source ?? 'flux-deploy-ready',
		url,
	}
}

function deriveAppName(name?: string): string | undefined {
	if (!name) {
		return undefined
	}

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
	if (value === 'preview' || value === 'stable') {
		return value
	}

	throw new Error(`Unsupported deploy-ready environment: ${value}`)
}

function normalizePrNumber(value: number | string | undefined): number | null {
	if (value === undefined || value === '') {
		return null
	}

	const parsed = Number(value)
	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new Error(`Invalid deploy-ready PR number: ${value}`)
	}

	return parsed
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function main(args: string[]): void {
	if (args[0] !== 'normalize' || !args[1]) {
		throw new Error('Usage: deploy-ready.ts normalize <github-event-json>')
	}

	const event = JSON.parse(
		readFileSync(args[1], 'utf8'),
	) as GitHubDispatchEnvelope
	console.log(JSON.stringify(normalizeDeployReadyEvent(event)))
}

if (process.argv[1] === import.meta.url.replace('file://', '')) {
	try {
		main(process.argv.slice(2))
	} catch (error) {
		if (error instanceof Error) {
			console.error(error.message)
		} else {
			console.error(String(error))
		}
		process.exit(1)
	}
}

export { normalizeDeployReadyEvent, type NormalizedDeployReadyEvent }
