#!/usr/bin/env node
import { Command } from 'commander'
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

	const program = new Command()
	program.name('aamini')
	program.description('@aamini-stack CLI tool')
	program.version('0.0.1')

	program.addCommand(createE2ECommand())
	program.addCommand(createSecretsCommand())
	program.addCommand(createDockerCommand())
	program.addCommand(createCICommand())

	program.command('pm', 'Project management').action(async () => {
		const interactive = $({ stdio: 'inherit' })
		await interactive`node --experimental-strip-types ${pmScriptPath} ${process.argv.slice(2)}`
	})

	program.parseAsync(process.argv)
}

void main()
