import { cac } from 'cac'
import { createDockerBuildCommand } from './build.ts'
import { createDockerPushCommand } from './push.ts'
import { createDockerDeployCommand } from './deploy.ts'

export function createDockerCommand(): ReturnType<typeof cac> {
	const cli = cac('aamini docker')
	cli.version('0.0.1')
	cli.help()

	cli.command('').action(() => {
		cli.outputHelp()
	})

	cli.command('build', 'Build Docker image').action(() => {
		const dockerBuildCli = createDockerBuildCommand()
		dockerBuildCli.parse(process.argv.slice(3))
	})

	cli.command('push', 'Push Docker image').action(() => {
		const dockerPushCli = createDockerPushCommand()
		dockerPushCli.parse(process.argv.slice(3))
	})

	cli.command('deploy', 'Deploy Docker container').action(() => {
		const dockerDeployCli = createDockerDeployCommand()
		dockerDeployCli.parse(process.argv.slice(3))
	})

	return cli
}
