#!/usr/bin/env node
import { cac } from 'cac'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { $ } from 'zx'
import { getRepoRoot } from './helpers/repo.ts'
import { createE2ECommand } from './commands/e2e.ts'
import {
	createDockerBuildCommand,
	createDockerPushCommand,
	createDockerDeployCommand,
} from './commands/docker/index.ts'
import {
	createCIPreviewCommand,
	createCIEventsCommand,
	createCIE2ECommand,
} from './commands/ci/index.ts'

async function main(): Promise<void> {
	const scriptDir = path.dirname(fileURLToPath(import.meta.url))
	const pmScriptPath = path.resolve(scriptDir, 'commands', 'pm.ts')

	const cli = cac('aamini')
	cli.help()
	cli.version('0.0.1')

	const subcommand = process.argv[2]

	if (subcommand === 'e2e') {
		const e2eCli = createE2ECommand()
		e2eCli.parse(process.argv.slice(2))
		return
	}

	if (subcommand === 'secrets') {
		const secretsSubcommand = process.argv[3]
		const repoRoot = await getRepoRoot()
		const { sealAll, unsealAll, updateAll } =
			await import('./helpers/secrets.ts')

		if (secretsSubcommand === 'seal') {
			await sealAll(repoRoot)
			return
		}
		if (secretsSubcommand === 'unseal') {
			await unsealAll(repoRoot)
			return
		}
		if (secretsSubcommand === 'update') {
			await updateAll(repoRoot)
			return
		}
		console.error('Error: Unknown secrets command. Use seal, unseal, or update')
		process.exit(1)
	}

	if (subcommand === 'docker') {
		const dockerSubcommand = process.argv[3]
		const args = process.argv.slice(4)

		if (dockerSubcommand === 'build') {
			const dockerBuildCli = createDockerBuildCommand()
			dockerBuildCli.parse(args)
			return
		}
		if (dockerSubcommand === 'push') {
			const dockerPushCli = createDockerPushCommand()
			dockerPushCli.parse(args)
			return
		}
		if (dockerSubcommand === 'deploy') {
			const dockerDeployCli = createDockerDeployCommand()
			dockerDeployCli.parse(args)
			return
		}
		console.error('Error: Unknown docker command. Use build, push, or deploy')
		process.exit(1)
	}

	if (subcommand === 'pm') {
		const interactive = $({ stdio: 'inherit' })
		await interactive`node --experimental-strip-types ${pmScriptPath} ${process.argv.slice(3)}`
		return
	}

	if (subcommand === 'ci') {
		const ciSubcommand = process.argv[3]

		if (ciSubcommand === 'preview') {
			const ciPreviewCli = createCIPreviewCommand()
			ciPreviewCli.parse(process.argv.slice(3))
			return
		}
		if (ciSubcommand === 'events') {
			const ciEventsCli = createCIEventsCommand()
			ciEventsCli.parse(process.argv.slice(3))
			return
		}
		if (ciSubcommand === 'e2e') {
			const ciE2eCli = createCIE2ECommand()
			ciE2eCli.parse(process.argv.slice(3))
			return
		}
		console.error('Error: Unknown ci command. Use preview, events, or e2e')
		process.exit(1)
	}

	console.error(`Error: Unknown command '${subcommand ?? ''}'`)
	cli.outputHelp()
	process.exit(1)
}

if (process.argv[1] === import.meta.url.replace('file://', '')) {
	void main().catch((error) => {
		if (error instanceof Error) {
			console.error(`Error: ${error.message}`)
		} else {
			console.error('Error:', error)
		}
		process.exit(1)
	})
}

export { main }
