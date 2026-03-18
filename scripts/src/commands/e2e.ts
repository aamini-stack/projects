import { cac } from 'cac'
import { getRepoRoot, listAppDirectories } from '../helpers/repo.ts'
import { runE2E, type E2EOptions } from '../helpers/e2e.ts'

export function createE2ECommand(): ReturnType<typeof cac> {
	const cli = cac('aamini e2e')
	cli.version('0.0.1')
	cli.help()

	cli.command('').action(() => {
		cli.outputHelp()
	})

	cli
		.command('run <app>', 'Run e2e for a specific app')
		.option('-l, --local', 'Run e2e locally with docker compose')
		.option('-p, --preview <pr>', 'Run e2e against preview deployment')
		.option('-s, --staging', 'Run e2e against staging')
		.option('-P, --production', 'Run e2e against production')
		.action(async (app: string, options: E2EOptions) => {
			await runE2E(await getRepoRoot(), app, options)
		})

	cli
		.command('--all', 'Run e2e for all apps')
		.option('-l, --local', 'Run e2e locally with docker compose')
		.option('-p, --preview <pr>', 'Run e2e against preview deployment')
		.option('-s, --staging', 'Run e2e against staging')
		.option('-P, --production', 'Run e2e against production')
		.action(async (options: E2EOptions) => {
			const repoRoot = await getRepoRoot()
			const apps = listAppDirectories(repoRoot)
			for (const app of apps) {
				await runE2E(repoRoot, app, options)
			}
		})

	return cli
}
