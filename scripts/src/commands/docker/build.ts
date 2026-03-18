import { cac } from 'cac'
import { getRepoRoot } from '../../helpers/repo.ts'
import { buildImage, parseApps } from '../../helpers/docker.ts'

export function createDockerBuildCommand(): ReturnType<typeof cac> {
	const cli = cac('aamini docker build')
	cli.help()
	cli.version('0.0.1')

	cli
		.command('<app>', 'Build Docker image for a specific app')
		.option('-a, --all', 'Build images for all apps')
		.action(async (app: string | undefined, options: { all?: boolean }) => {
			const repoRoot = await getRepoRoot()
			const apps = options.all
				? parseApps(repoRoot, ['--all'])
				: app
					? [app]
					: []

			if (apps.length === 0) {
				console.error('Error: Specify an app name or use --all')
				process.exit(1)
			}

			for (const appName of apps) {
				await buildImage(repoRoot, appName)
			}
		})

	cli.addEventListener('command:*', () => {
		console.error(`Error: Unknown command '${cli.args[0] ?? ''}'`)
		cli.outputHelp()
		process.exit(1)
	})

	return cli
}
