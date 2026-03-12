import { $ } from 'zx'

async function runCi(repoRoot: string, args: string[]): Promise<void> {
	const context = await getCiContext(repoRoot, args)
	await runDaggerCall(repoRoot, [
		'ci',
		`--event=${context.event}`,
		`--sha=${context.sha}`,
		'--ghcr-token=env:GHCR_TOKEN',
		`--changed-apps-csv=${context.changedAppsCsv}`,
		`--base-ref=${context.baseRef}`,
		`--head-ref=${context.headRef}`,
		...context.passthroughArgs,
	])
}

async function runDaggerCall(repoRoot: string, args: string[]): Promise<void> {
	const result = await $({
		cwd: repoRoot,
		nothrow: true,
		stdio: 'inherit',
		env: process.env,
	})`dagger --progress=plain call ${args}`

	if (result.exitCode !== 0) {
		throw new Error(`Dagger CI failed with exit code ${result.exitCode}.`)
	}
}

async function getCiContext(repoRoot: string, args: string[]): Promise<{
	baseRef: string
	changedAppsCsv: string
	event: 'pull_request' | 'push'
	headRef: string
	passthroughArgs: string[]
	sha: string
}> {
	const explicitEventArg = args.find((arg) => arg.startsWith('--event='))
	const explicitEvent = explicitEventArg?.split('=')[1]
	const currentBranch = await gitOutput(repoRoot, [
		'git',
		'rev-parse',
		'--abbrev-ref',
		'HEAD',
	])

	const event =
		explicitEvent ??
		(currentBranch === 'main' || currentBranch === 'origin/main'
			? 'push'
			: 'pull_request')

	if (event !== 'pull_request' && event !== 'push') {
		throw new Error(
			`Unsupported event '${event}'. Use --event=pull_request or --event=push.`,
		)
	}

	const sha = await gitOutput(repoRoot, ['git', 'rev-parse', 'HEAD'])
	const headRef = sha
	const baseRef =
		event === 'pull_request'
			? await gitOutput(repoRoot, ['git', 'merge-base', 'origin/main', 'HEAD'])
			: await gitOutput(repoRoot, ['git', 'rev-parse', 'HEAD^'])
	const changedAppsCsv = await getChangedAppsCsv(repoRoot, baseRef, headRef)

	const passthroughArgs = args.filter((arg) => !arg.startsWith('--event='))
	await ensureGhcrToken()

	return {
		baseRef,
		changedAppsCsv,
		event,
		headRef,
		passthroughArgs,
		sha,
	}
}

async function ensureGhcrToken(): Promise<void> {
	if (!process.env.GHCR_TOKEN) {
		throw new Error('GHCR_TOKEN must be set to run the Dagger CI wrapper.')
	}
}

async function gitOutput(repoRoot: string, command: string[]): Promise<string> {
	const result = await $({
		cwd: repoRoot,
		stdio: 'pipe',
	})`${command}`

	return result.stdout.trim()
}

async function getChangedAppsCsv(
	repoRoot: string,
	baseRef: string,
	headRef: string,
): Promise<string> {
	const diffOutput = await gitOutput(repoRoot, [
		'git',
		'diff',
		'--name-only',
		baseRef,
		headRef,
	])

	const apps = [...new Set(
		diffOutput
			.split('\n')
			.flatMap((line) => {
				if (!line.startsWith('apps/')) {
					return []
				}

				const segments = line.split('/')
				return segments[1] ? [segments[1]] : []
			}),
	)].sort()

	return apps.join(',')
}

export { runCi }
