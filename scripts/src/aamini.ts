#!/usr/bin/env node
import { cac } from 'cac'
import { createE2ECommand } from './commands/e2e.ts'
import { createSecretsCommand } from './commands/secrets.ts'
import { createDockerCommand } from './commands/docker.ts'
import { createPMCommand } from './commands/pm.ts'
import { createCICommand } from './commands/ci.ts'

async function main(): Promise<void> {
	const cli = cac('aamini')
	cli.version('0.0.1')
	cli.help()

	cli.command('').action(() => {
		cli.outputHelp()
	})

	cli.command('e2e', 'Run e2e tests').action(() => {
		const e2eCli = createE2ECommand()
		e2eCli.parse(process.argv.slice(2))
	})

	cli.command('secrets', 'Manage secrets').action(() => {
		const secretsCli = createSecretsCommand()
		secretsCli.parse(process.argv.slice(2))
	})

	cli.command('docker', 'Docker commands').action(() => {
		const dockerCli = createDockerCommand()
		dockerCli.parse(process.argv.slice(2))
	})

	cli.command('pm', 'Project management commands').action(() => {
		const pmCli = createPMCommand()
		pmCli.parse(process.argv.slice(2))
	})

	cli.command('ci', 'CI commands').action(() => {
		const ciCli = createCICommand()
		ciCli.parse(process.argv.slice(2))
	})

	cli.parse(process.argv)
}

void main()
