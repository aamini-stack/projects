#!/usr/bin/env node
import { Command } from 'commander'
import { createE2ECommand } from './commands/e2e.ts'
import { createSecretsCommand } from './commands/secrets.ts'
import { createDockerCommand } from './commands/docker.ts'
import { createCICommand } from './commands/ci.ts'
import { createPMCommand } from './commands/pm.ts'
import { createDeployCommand } from './commands/deploy.ts'

async function main(): Promise<void> {
	const program = new Command()
	program.name('aamini')
	program.description('@aamini-stack CLI tool')
	program.version('0.0.1')

	program.addCommand(createE2ECommand())
	program.addCommand(createSecretsCommand())
	program.addCommand(createDockerCommand())
	program.addCommand(createCICommand())
	program.addCommand(createPMCommand())
	program.addCommand(createDeployCommand())

	void program.parseAsync(process.argv)
}

void main()
