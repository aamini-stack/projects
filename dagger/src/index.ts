import {
	Container,
	type Directory,
	Secret,
	dag,
	func,
	object,
} from '@dagger.io/dagger'

const NODE_VERSION = '22'
const PNPM_VERSION = '10.32.1'
const APP_PATH_PREFIX = 'apps/'
const REPO_PATH = '/src'

type Status = 'passed' | 'failed' | 'skipped'

type CommandResult = {
	name: string
	status: Status
	log: string
}

type DeployResult = {
	app: string
	image?: string
	publishStatus: 'passed' | 'failed'
	log: string
}

type LaneResult = {
	name: string
	status: Status
	results: CommandResult[]
}

@object()
export class PreviewPipeline {
	@func()
	async ci(
		event: string,
		sha: string,
		ghcrToken: Secret,
		changedAppsCsv?: string,
		baseRef?: string,
		headRef?: string,
	): Promise<string> {
		if (event !== 'pull_request' && event !== 'push') {
			throw new Error(`Unsupported event '${event}'. Expected pull_request or push.`)
		}

		const source = await this.repoSource()
		const changedApps = await this.resolveChangedApps(
			source,
			baseRef,
			headRef,
			sha,
			changedAppsCsv,
		)

		const [quality, integration, deploy] = await Promise.all([
			this.runQuality(source),
			this.runIntegration(source),
			this.runDeploy(source, changedApps, sha, ghcrToken),
		])

		const summary = this.renderSummary({
			event,
			sha,
			changedApps,
			quality,
			integration,
			deploy,
		})

		if (
			quality.status === 'failed' ||
			integration.status === 'failed' ||
			deploy.status === 'failed'
		) {
			console.error(summary)
			throw new Error(summary)
		}

		console.log(summary)
		return summary
	}

	@func()
	async changedApps(baseRef: string, headRef: string, sha?: string): Promise<string> {
		const source = await this.repoSource()
		const apps = await this.resolveChangedApps(source, baseRef, headRef, sha ?? headRef)
		return apps.join('\n')
	}

	@func()
	async quality(): Promise<string> {
		const result = await this.runQuality(await this.repoSource())
		return this.renderLane(result)
	}

	@func()
	async integration(): Promise<string> {
		const result = await this.runIntegration(await this.repoSource())
		return this.renderLane(result)
	}

	@func()
	async deploy(
		sha: string,
		ghcrToken: Secret,
		changedAppsCsv?: string,
		baseRef?: string,
		headRef?: string,
	): Promise<string> {
		const source = await this.repoSource()
		const changedApps = await this.resolveChangedApps(
			source,
			baseRef,
			headRef,
			sha,
			changedAppsCsv,
		)
		const result = await this.runDeploy(source, changedApps, sha, ghcrToken)
		return this.renderLane(result)
	}

	@func()
	async publishImage(app: string, sha: string, ghcrToken: Secret): Promise<string> {
		const result = await this.publishAppImage(
			await this.repoSource(),
			app,
			sha,
			ghcrToken,
		)

		if (result.publishStatus === 'failed') {
			throw new Error(result.log)
		}

		return result.log
	}

	@func()
	async e2eStaging(app: string): Promise<string> {
		const source = await this.repoSource()

		try {
			console.error(`deploy: running staging e2e for ${app}`)
			await this.playwrightContainer(source)
				.withWorkdir(`${REPO_PATH}/apps/${app}`)
				.withExec(['pnpm', 'e2e:staging'])
				.sync()
		} catch (error) {
			throw new Error(this.formatError(error))
		}

		return `Ran pnpm e2e:staging for ${app}.`
	}

	private async repoSource(): Promise<Directory> {
		return dag.currentWorkspace().directory('.')
	}

	private baseNodeContainer(source: Directory): Container {
		return dag
			.container()
			.from(`node:${NODE_VERSION}-bookworm-slim`)
			.withEnvVariable('CI', 'true')
			.withEnvVariable('COREPACK_ENABLE_DOWNLOAD_PROMPT', '0')
			.withEnvVariable('TURBO_TELEMETRY_DISABLED', '1')
			.withMountedCache('/pnpm/store', dag.cacheVolume('pnpm-store'))
			.withDirectory(REPO_PATH, source)
			.withWorkdir(REPO_PATH)
			.withExec(['corepack', 'enable'])
			.withExec(['corepack', 'prepare', `pnpm@${PNPM_VERSION}`, '--activate'])
			.withExec(['pnpm', 'install', '--frozen-lockfile'])
	}

	private playwrightContainer(source: Directory): Container {
		return dag
			.container()
			.from('mcr.microsoft.com/playwright:v1.58.2-noble')
			.withEnvVariable('CI', 'true')
			.withEnvVariable('COREPACK_ENABLE_DOWNLOAD_PROMPT', '0')
			.withEnvVariable('TURBO_TELEMETRY_DISABLED', '1')
			.withMountedCache('/pnpm/store', dag.cacheVolume('pnpm-store'))
			.withDirectory(REPO_PATH, source)
			.withWorkdir(REPO_PATH)
			.withExec(['corepack', 'enable'])
			.withExec(['corepack', 'prepare', `pnpm@${PNPM_VERSION}`, '--activate'])
			.withExec(['pnpm', 'install', '--frozen-lockfile'])
	}

	private async resolveChangedApps(
		source: Directory,
		baseRef: string | undefined,
		headRef: string | undefined,
		sha: string,
		changedAppsCsv?: string,
	): Promise<string[]> {
		console.error('ci: resolving changed apps')
		if (changedAppsCsv !== undefined) {
			const apps = [...new Set(
				changedAppsCsv
					.split(',')
					.map((app) => app.trim())
					.filter(Boolean),
			)].sort()

			console.error(
				`ci: changed apps = ${apps.length > 0 ? apps.join(', ') : '(none)'} (injected)`,
			)

			return apps
		}

		const effectiveHeadRef = headRef ?? sha
		const effectiveBaseRef = baseRef ?? `${effectiveHeadRef}^`

		const diffOutput = await dag
			.container()
			.from('alpine/git:2.49.1')
			.withDirectory(REPO_PATH, source)
			.withWorkdir(REPO_PATH)
			.withExec(['diff', '--name-only', effectiveBaseRef, effectiveHeadRef])
			.stdout()

		const apps = [...new Set(
			diffOutput
				.split('\n')
				.flatMap((line) => {
					if (!line.startsWith(APP_PATH_PREFIX)) {
						return []
					}

					const segments = line.split('/')
					return segments[1] ? [segments[1]] : []
				}),
		)].sort()

		console.error(
			`ci: changed apps = ${apps.length > 0 ? apps.join(', ') : '(none)'}`,
		)

		return apps
	}

	private async runQuality(source: Directory): Promise<LaneResult> {
		console.error('quality: starting')
		const commands: Array<[string, string[]]> = [
			['build', ['pnpm', 'build']],
			['lint', ['pnpm', 'lint']],
			['format', ['pnpm', 'format']],
			['test:unit', ['pnpm', 'test:unit']],
			['typecheck', ['pnpm', 'typecheck']],
		]

		const results = await Promise.all(
			commands.map(([name, command]) =>
				this.runCommand(this.baseNodeContainer(source), name, command),
			),
		)

		return {
			name: 'quality',
			status: results.some((result) => result.status === 'failed')
				? 'failed'
				: results.every((result) => result.status === 'skipped')
					? 'skipped'
					: 'passed',
			results,
		}
	}

	private async runIntegration(source: Directory): Promise<LaneResult> {
		console.error('integration: starting test:integration')
		const result = await this.runCommand(
			this.playwrightContainer(source),
			'test:integration',
			['pnpm', 'test:integration'],
		)

		return {
			name: 'integration',
			status: result.status,
			results: [result],
		}
	}

	private async runDeploy(
		source: Directory,
		apps: string[],
		sha: string,
		ghcrToken: Secret,
	): Promise<LaneResult> {
		console.error('deploy: starting')
		if (apps.length === 0) {
			console.error('deploy: skipped, no changed apps')
			return {
				name: 'deploy',
				status: 'skipped',
				results: [
					{
						name: 'deploy',
						status: 'skipped',
						log: 'No app changes detected under apps/*',
					},
				],
			}
		}

		const publishResults = await Promise.all(
			apps.map((app) => this.publishAppImage(source, app, sha, ghcrToken)),
		)

		const results = await Promise.all(
			publishResults.map(async (result) => {
				if (result.publishStatus !== 'passed') {
					return {
						name: result.app,
						status: 'failed',
						log: [
							`publish: ${result.publishStatus}`,
							`image: ${result.image ?? '(none)'}`,
							'e2e: skipped',
							result.log,
							'Skipped e2e because image publish failed.',
						].join('\n'),
					} satisfies CommandResult
				}

				try {
					await this.runStagingE2E(source, result.app)

					return {
						name: result.app,
						status: 'passed',
						log: [
							`publish: ${result.publishStatus}`,
							`image: ${result.image ?? '(none)'}`,
							'e2e: passed',
							result.log,
							'Ran pnpm e2e:staging.',
						].join('\n'),
					} satisfies CommandResult
				} catch (error) {
					return {
						name: result.app,
						status: 'failed',
						log: [
							`publish: ${result.publishStatus}`,
							`image: ${result.image ?? '(none)'}`,
							'e2e: failed',
							result.log,
							this.formatError(error),
						].join('\n'),
					} satisfies CommandResult
				}
			}),
		)

		return {
			name: 'deploy',
			status: results.some((result) => result.status === 'failed') ? 'failed' : 'passed',
			results,
		}
	}

	private async publishAppImage(
		source: Directory,
		app: string,
		sha: string,
		ghcrToken: Secret,
	): Promise<DeployResult> {
		const imageRef = `ghcr.io/aamini-stack/${app}:${sha}`

		try {
			console.error(`deploy: building and publishing ${imageRef}`)
			const image = source
				.dockerBuild({
					dockerfile: 'Dockerfile',
					buildArgs: [{ name: 'APP_NAME', value: app }],
					target: 'production',
				})
				.withRegistryAuth('ghcr.io', 'aamini-stack', ghcrToken)

			const publishedRef = await image.publish(imageRef)

			return {
				app,
				image: publishedRef,
				publishStatus: 'passed',
				log: `Published ${publishedRef}`,
			}
		} catch (error) {
			return {
				app,
				image: imageRef,
				publishStatus: 'failed',
				log: this.formatError(error),
			}
		}
	}

	private async runStagingE2E(source: Directory, app: string): Promise<void> {
		console.error(`deploy: running staging e2e for ${app}`)
		await this.playwrightContainer(source)
			.withWorkdir(`${REPO_PATH}/apps/${app}`)
			.withExec(['pnpm', 'e2e:staging'])
			.sync()
	}

	private async runCommand(
		container: Container,
		name: string,
		command: string[],
	): Promise<CommandResult> {
		try {
			console.error(`quality: running ${name}`)
			const executed = container.withExec(command)
			const [stdout, stderr] = await Promise.all([
				executed.stdout(),
				executed.stderr(),
			])

			return {
				name,
				status: 'passed',
				log: [stdout.trim(), stderr.trim()].filter(Boolean).join('\n') || '(no output)',
			}
		} catch (error) {
			console.error(`quality: failed ${name}`)
			return {
				name,
				status: 'failed',
				log: this.formatError(error),
			}
		}
	}

	private renderSummary(input: {
		event: string
		sha: string
		changedApps: string[]
		quality: LaneResult
		integration: LaneResult
		deploy: LaneResult
	}): string {
		const lines = [
			`CI summary`,
			`event: ${input.event}`,
			`sha: ${input.sha}`,
			`changed apps: ${
				input.changedApps.length > 0 ? input.changedApps.join(', ') : '(none)'
			}`,
			'',
			`${input.quality.name}: ${input.quality.status}`,
			...input.quality.results.map((result) =>
				`- ${result.name}: ${result.status}\n${result.log
					.trim()
					.split('\n')
					.map((line) => `  ${line}`)
					.join('\n')}`,
			),
			'',
			`${input.integration.name}: ${input.integration.status}`,
			...input.integration.results.map((result) =>
				`- ${result.name}: ${result.status}\n${result.log
					.trim()
					.split('\n')
					.map((line) => `  ${line}`)
					.join('\n')}`,
			),
			'',
			`${input.deploy.name}: ${input.deploy.status}`,
			...input.deploy.results.map((result) =>
				`- ${result.name}: ${result.status}\n${result.log
					.trim()
					.split('\n')
					.map((line) => `  ${line}`)
					.join('\n')}`,
			),
		]

		return lines.join('\n')
	}

	private renderLane(lane: LaneResult): string {
		return [
			`${lane.name}: ${lane.status}`,
			...lane.results.map((result) =>
				`- ${result.name}: ${result.status}\n${result.log
					.trim()
					.split('\n')
					.map((line) => `  ${line}`)
					.join('\n')}`,
			),
		].join('\n')
	}

	private formatError(error: unknown): string {
		if (typeof error === 'object' && error !== null) {
			const maybeExecError = error as {
				cmd?: string[]
				exitCode?: number
				stdout?: string
				stderr?: string
				message?: string
			}

			if (
				Array.isArray(maybeExecError.cmd) ||
				typeof maybeExecError.exitCode === 'number' ||
				typeof maybeExecError.stdout === 'string' ||
				typeof maybeExecError.stderr === 'string'
			) {
				const lines: string[] = []

				if (Array.isArray(maybeExecError.cmd) && maybeExecError.cmd.length > 0) {
					lines.push(`command: ${maybeExecError.cmd.join(' ')}`)
				}

				if (typeof maybeExecError.exitCode === 'number') {
					lines.push(`exit code: ${maybeExecError.exitCode}`)
				}

				const output =
					[
						maybeExecError.stdout?.trim(),
						maybeExecError.stderr?.trim(),
					]
						.filter(Boolean)
						.join('\n') || maybeExecError.message || '(no output)'

				lines.push(output)
				return lines.join('\n')
			}
		}

		if (error instanceof Error) {
			return error.message
		}

		return String(error)
	}
}
