import { cac } from 'cac'
import path from 'node:path'
import { mkdirSync } from 'node:fs'
import { renderGitopsBundle } from '../../../../packages/infra/src/gitops/render.ts'
import { getRepoRoot } from '../../helpers/repo.ts'

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

async function runDeploy(
	repoRoot: string,
	deployRevision?: string,
): Promise<void> {
	const sourceRoot = path.join(repoRoot, 'packages', 'infra', 'manifests')
	const outputRoot = path.join(repoRoot, '.tmp/gitops-bundle')

	mkdirSync(path.dirname(outputRoot), { recursive: true })
	renderGitopsBundle({
		sourceRoot,
		outputRoot,
		appManifestRoot: repoRoot,
		...(deployRevision ? { deployRevision } : {}),
	})
	console.log(outputRoot)
}
