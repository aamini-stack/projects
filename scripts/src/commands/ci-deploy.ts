import { appendFileSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { Command } from 'commander'
import { getRepoRoot } from '../helpers/repo.ts'

type PullRequestEvent = {
	pull_request?: {
		number?: number
		base?: { sha?: string }
		head?: { repo?: { full_name?: string } }
	}
}

export type DeployDecisionInput = {
	eventName: string
	repository: string
	headRepoFullName?: string
	app: string
	sha: string
	prNumber?: number
	turboExitCode?: number
	turboPackages?: string[]
}

export type DeployDecision = {
	changed: boolean
	reason:
		| 'fork-pr'
		| 'push-main'
		| 'turbo-detect-fallback'
		| 'no-changed-apps'
		| 'app-changed'
		| 'app-unchanged'
	imageTag: string
}

export function deriveDeployDecision(
	input: DeployDecisionInput,
): DeployDecision {
	const imageTag =
		input.eventName === 'pull_request' && input.prNumber
			? `pr-${input.prNumber}`
			: `main-${input.sha}`

	if (
		input.eventName === 'pull_request' &&
		input.headRepoFullName &&
		input.headRepoFullName !== input.repository
	) {
		return { changed: false, reason: 'fork-pr', imageTag }
	}

	if (input.eventName === 'push') {
		return { changed: true, reason: 'push-main', imageTag }
	}

	if (input.turboExitCode !== 0 || !input.turboPackages) {
		return { changed: true, reason: 'turbo-detect-fallback', imageTag }
	}

	if (input.turboPackages.length === 0) {
		return { changed: false, reason: 'no-changed-apps', imageTag }
	}

	if (
		input.turboPackages.includes(`apps/${input.app}`) ||
		input.turboPackages.includes(input.app)
	) {
		return { changed: true, reason: 'app-changed', imageTag }
	}

	return { changed: false, reason: 'app-unchanged', imageTag }
}

type DeployOutputsOptions = {
	eventName: string
	eventPath: string
	repository: string
	app: string
	sha: string
	outputPath: string
}

export function createCIDeployCommand(): Command {
	const deployCmd = new Command('deploy')
	deployCmd.description('Deploy workflow utilities')
	deployCmd
		.command('outputs', 'Write deploy outputs to GitHub Actions')
		.action(async () => {
			const options = parseDeployOutputsArgs(process.argv.slice(5))
			await writeDeployOutputs(options)
		})
	return deployCmd
}

function parseDeployOutputsArgs(args: string[]): DeployOutputsOptions {
	const values: Record<string, string> = {}
	for (let index = 0; index < args.length; index += 2) {
		const key = args[index]
		const value = args[index + 1]
		if (!key?.startsWith('--') || value === undefined) {
			throw new Error(
				'Usage: deploy outputs --repository <owner/repo> --event-name <name> --event-path <path> --app <app> --sha <sha> --github-output <path>',
			)
		}
		values[key.slice(2)] = value
	}

	if (
		!values.repository ||
		!values['event-name'] ||
		!values['event-path'] ||
		!values.app ||
		!values.sha ||
		!values['github-output']
	) {
		throw new Error('Missing required arguments')
	}

	return {
		eventName: values['event-name'],
		eventPath: values['event-path'],
		repository: values.repository,
		app: values.app,
		sha: values.sha,
		outputPath: values['github-output'],
	}
}

async function writeDeployOutputs(
	options: DeployOutputsOptions,
): Promise<void> {
	const event = JSON.parse(
		readFileSync(options.eventPath, 'utf8'),
	) as PullRequestEvent
	const pr = event.pull_request
	const prNumber =
		pr?.number && Number.isInteger(pr.number) && pr.number > 0
			? pr.number
			: undefined

	let turboExitCode = 1
	let turboPackages: string[] | undefined

	if (options.eventName === 'pull_request' && pr?.base?.sha) {
		const repoRoot = await getRepoRoot()
		const filter = `{./apps/*}...[${pr.base.sha}...${options.sha}]`
		const turbo = spawnSync(
			'pnpm',
			['turbo', 'run', 'build', `--filter=${filter}`, '--dry=json'],
			{
				cwd: repoRoot,
				encoding: 'utf8',
			},
		)

		turboExitCode = turbo.status ?? 1
		if (turboExitCode === 0) {
			try {
				const parsed = JSON.parse(turbo.stdout || '{}') as {
					packages?: string[]
				}
				turboPackages = Array.isArray(parsed.packages)
					? parsed.packages.filter(
							(pkg): pkg is string => typeof pkg === 'string',
						)
					: []
			} catch {
				turboExitCode = 1
			}
		}
	}

	const decision = deriveDeployDecision({
		eventName: options.eventName,
		repository: options.repository,
		app: options.app,
		sha: options.sha,
		...(pr?.head?.repo?.full_name
			? { headRepoFullName: pr.head.repo.full_name }
			: {}),
		...(prNumber ? { prNumber } : {}),
		turboExitCode,
		...(turboPackages ? { turboPackages } : {}),
	})

	appendFileSync(
		options.outputPath,
		[
			`changed=${decision.changed ? 'true' : 'false'}`,
			`reason=${decision.reason}`,
			`image_tag=${decision.imageTag}`,
		].join('\n') + '\n',
		'utf8',
	)
}
