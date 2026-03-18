#!/usr/bin/env node
import { cac } from 'cac'
import { createE2ECommand } from './commands/e2e.ts'
import { createSecretsCommand } from './commands/secrets.ts'
import { createDockerCommand } from './commands/docker/index.ts'
import { createPMCommand } from './commands/pm.ts'
import { createCICommand } from './commands/ci/index.ts'

async function main(): Promise<void> {
	const cli = cac('aamini')
	cli.version('0.0.1')

	cli
		.command('e2e', 'Run e2e tests')
		.allowUnknownOptions()
		.action(() => {
			const args = process.argv.slice(2)
			const e2eCli = createE2ECommand()
			if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
				e2eCli.outputHelp()
			} else {
				e2eCli.parse(args)
			}
		})

	cli
		.command('secrets', 'Manage secrets')
		.allowUnknownOptions()
		.action(() => {
			const args = process.argv.slice(3)
			const secretsCli = createSecretsCommand()
			secretsCli.parse(args)
			if (args.length === 0) {
				secretsCli.outputHelp()
			}
		})

	cli
		.command('docker', 'Docker commands')
		.allowUnknownOptions()
		.action(() => {
			const args = process.argv.slice(3)
			const dockerCli = createDockerCommand()
			dockerCli.parse(args)
			if (args.length === 0) {
				dockerCli.outputHelp()
			}
		})

	cli
		.command('pm', 'Project management commands')
		.allowUnknownOptions()
		.action(() => {
			const args = process.argv.slice(3)
			const pmCli = createPMCommand()
			pmCli.parse(args)
			if (args.length === 0) {
				pmCli.outputHelp()
			}
		})

	cli
		.command('ci', 'CI commands')
		.allowUnknownOptions()
		.action(() => {
			const args = process.argv.slice(3)
			const ciCli = createCICommand()
			ciCli.parse(args)
			if (args.length === 0) {
				ciCli.outputHelp()
			}
		})

	if (process.argv.length === 2) {
		cli.outputHelp()
	}
}

void main()

export { main }
