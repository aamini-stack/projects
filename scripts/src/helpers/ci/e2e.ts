import { getRepoRoot, listAppDirectories } from '../repo.ts'
import {
	createCommitStatus,
	getCombinedCommitStatus,
	listPullRequestFiles,
	parseRepo,
	parseOptionalInt,
} from '../../commands/github.ts'

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

export function parseStatusArgs(args: string[]): StatusOptions {
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
			state: options.result!,
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
