import { cac } from 'cac'
import { createDockerBuildCommand } from './build.ts'
import { createDockerPushCommand } from './push.ts'
import { createDockerDeployCommand } from './deploy.ts'

export function createDockerCommand(): ReturnType<typeof cac> {
	const cli = cac('aamini docker')
	cli.version('0.0.1')

	cli
		.command('build', 'Build Docker image')
		.allowUnknownOptions()
		.action(() => {
			const dockerBuildCli = createDockerBuildCommand()
			dockerBuildCli.parse(process.argv.slice(3))
		})

	cli
		.command('push', 'Push Docker image')
		.allowUnknownOptions()
		.action(() => {
			const dockerPushCli = createDockerPushCommand()
			dockerPushCli.parse(process.argv.slice(3))
		})

	cli
		.command('deploy', 'Deploy Docker container')
		.allowUnknownOptions()
		.action(() => {
			const dockerDeployCli = createDockerDeployCommand()
			dockerDeployCli.parse(process.argv.slice(3))
		})

	cli.addEventListener('command:*', () => {
		console.error(`Error: Unknown docker command`)
		cli.outputHelp()
		process.exit(1)
	})

	return cli
}
