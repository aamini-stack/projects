#!/usr/bin/env node
import { Command } from 'commander'
import { createE2ECommand } from './commands/e2e.ts'
import { createSecretsCommand } from './commands/secrets.ts'
import { createCICommand } from './commands/ci.ts'
import { createPMCommand } from './commands/pm.ts'
import { createEnvCommand } from './commands/env.ts'

async function main(): Promise<void> {
	const program = new Command()
	program.name('aamini')
	program.description('@aamini-stack CLI tool')
	program.version('0.0.1')

	program.addCommand(createE2ECommand())
	program.addCommand(createSecretsCommand())
	program.addCommand(createCICommand())
	program.addCommand(createPMCommand())
	program.addCommand(createEnvCommand())

	void program.parseAsync(process.argv)
}

void main()
