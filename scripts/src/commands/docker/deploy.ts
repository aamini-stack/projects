import { cac } from 'cac'
import { getRepoRoot } from '../../helpers/repo.ts'
import { runDeploy } from '../../helpers/docker.ts'

export function createDockerDeployCommand(): ReturnType<typeof cac> {
	const cli = cac('aamini docker deploy')
	cli.help()
	cli.version('0.0.1')

	cli
		.command('<app>', 'Deploy a specific app')
		.option('-a, --all', 'Deploy all apps')
		.option('-r, --deploy-revision <sha>', 'Deploy specific revision')
		.action(
			async (
				app: string | undefined,
				options: { all?: boolean; deployRevision?: string },
			) => {
				const repoRoot = await getRepoRoot()

				if (!app && !options.all) {
					console.error('Error: Specify an app name or use --all')
					process.exit(1)
				}

				await runDeploy(repoRoot, options.deployRevision)
			},
		)

	cli.addEventListener('command:*', () => {
		console.error(`Error: Unknown command '${cli.args[0] ?? ''}'`)
		cli.outputHelp()
		process.exit(1)
	})

	return cli
}
