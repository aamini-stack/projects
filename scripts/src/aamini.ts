#!/usr/bin/env node
import { cac } from 'cac'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { $ } from 'zx'
import { runE2E } from './e2e.ts'
import { runBuild } from './helpers/build.ts'
import { sealAll, unsealAll } from './helpers/k8secrets.ts'
import { getRepoRoot } from './helpers/repo.ts'

async function main(): Promise<void> {
	const cli = cac('aamini')
	cli.help()
	cli.version('0.0.1')

	const getRawCommandArgs = (): string[] => {
		return process.argv.slice(3).filter((arg) => arg !== '--')
	}

	cli
		.command('e2e [...args]', 'Run e2e for one app or all')
		.allowUnknownOptions()
		.action(async () => {
			await runE2E(await getRepoRoot(), getRawCommandArgs())
		})

	cli
		.command('build [...args]', 'Run build for one app or all')
		.allowUnknownOptions()
		.action(async () => {
			await runBuild(await getRepoRoot(), getRawCommandArgs())
		})

	cli
		.command('seal', 'Seal Kubernetes secrets for all apps')
		.action(async () => {
			await sealAll(await getRepoRoot())
		})

	cli
		.command('unseal', 'Unseal Kubernetes secrets for all apps')
		.action(async () => {
			await unsealAll(await getRepoRoot())
		})

	cli
		.command('ralph <task-id>', 'Run Ralph workflow for task')
		.action(async (taskId: string) => {
			await $`node --experimental-strip-types ${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ralph.ts')} ${taskId}`
		})

	cli
		.command('pm [...args]', 'Run task manager commands')
		.allowUnknownOptions()
		.action(async () => {
			await $`node --experimental-strip-types ${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'pm.ts')} ${getRawCommandArgs()}`
		})

	cli.on('command:*', () => {
		console.error(`Error: Unknown command '${cli.args[0] ?? ''}'`)
		cli.outputHelp()
		process.exit(1)
	})

	try {
		cli.parse()
	} catch (error) {
		if (error instanceof Error) {
			console.error(`Error: ${error.message}`)
		} else {
			console.error('Error:', error)
		}
		process.exitCode = 1
	}
}

if (process.argv[1] === import.meta.url.replace('file://', '')) {
	void main()
}

export { main }
