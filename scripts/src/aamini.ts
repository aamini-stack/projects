#!/usr/bin/env node
import { cac } from 'cac'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { $ } from 'zx'
import { createE2ECommand } from './commands/e2e.ts'
import { createSecretsCommand } from './commands/secrets.ts'
import { createDockerCommand } from './commands/docker.ts'
import { createCICommand } from './commands/ci.ts'

async function main(): Promise<void> {
	const scriptDir = path.dirname(fileURLToPath(import.meta.url))
	const pmScriptPath = path.resolve(scriptDir, 'commands', 'pm.ts')

	const cli = cac('aamini')
	cli.help()
	cli.version('0.0.1')

	const subcommand = process.argv[2]

	if (
		subcommand === '--help' ||
		subcommand === '-h' ||
		subcommand === undefined
	) {
		cli.outputHelp()
		process.exit(subcommand === undefined ? 0 : 0)
	}

	if (subcommand === 'e2e') {
		const e2eCli = createE2ECommand()
		e2eCli.parse(process.argv.slice(3))
		return
	}

	if (subcommand === 'secrets') {
		const secretsCli = createSecretsCommand()
		secretsCli.parse(process.argv.slice(3))
		return
	}

	if (subcommand === 'docker') {
		const dockerCli = createDockerCommand()
		dockerCli.parse(process.argv.slice(3))
		return
	}

	if (subcommand === 'pm') {
		const interactive = $({ stdio: 'inherit' })
		await interactive`node --experimental-strip-types ${pmScriptPath} ${process.argv.slice(3)}`
		return
	}

	if (subcommand === 'ci') {
		const ciCli = createCICommand()
		ciCli.parse(process.argv.slice(3))
		return
	}

	console.error(`Error: Unknown command '${subcommand ?? ''}'`)
	cli.outputHelp()
	process.exit(1)
}

void main()
