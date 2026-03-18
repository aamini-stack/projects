#!/usr/bin/env node
import { cac } from 'cac'
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
import {
	cmdCi,
	cmdBlocked,
	cmdDone,
	cmdDoneJson,
	cmdNext,
	cmdProgress,
	cmdShow,
	cmdUpdate,
	cmdWipe,
	readFromStdin,
} from './helpers/pm.ts'

async function main(): Promise<void> {
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
		const pmCli = cac('aamini pm')
		pmCli.help()
		pmCli.version('0.0.1')

		pmCli.command('next', 'Show next available tasks').action(() => {
			cmdNext()
		})

		pmCli.command('progress', 'Show task progress').action(() => {
			cmdProgress()
		})

		pmCli.command('wipe', 'Wipe all progress fields').action(() => {
			cmdWipe()
		})

		pmCli
			.command('show <id>', 'Show details for a task')
			.action((id: string) => {
				cmdShow(id)
			})

		pmCli
			.command('update <id> <field> [...value]', 'Update task field')
			.action((id: string, field: string, value: string[] = []) => {
				if (value.length === 0) {
					console.error('Error: Usage: aamini pm update <id> <field> <value>')
					process.exit(1)
				}
				cmdUpdate(id, field, value.join(' '))
			})

		pmCli
			.command('done [taskOrJson] [commitSha] [...notes]', 'Mark task done')
			.action(
				async (
					taskOrJson: string | undefined,
					commitSha: string | undefined,
					notes: string[] = [],
				) => {
					if (!taskOrJson) {
						const jsonStr = await readFromStdin()
						if (jsonStr) {
							cmdDoneJson(jsonStr)
							return
						}
						console.error(
							'Error: Usage: aamini pm done <task-id> <commit-sha> [notes]',
						)
						console.error(
							'       or: aamini pm done \'{"task": 1, "status": "done", "sha": "abc", "notes": "..."}\'',
						)
						console.error(
							'       or: echo \'{"task": 1, ...}\' | aamini pm done',
						)
						process.exit(1)
					}

					if (taskOrJson.startsWith('{')) {
						cmdDoneJson(taskOrJson)
						return
					}

					if (!commitSha) {
						console.error(
							'Error: Usage: aamini pm done <task-id> <commit-sha> [notes]',
						)
						process.exit(1)
					}

					cmdDone(taskOrJson, commitSha, notes.join(' '))
				},
			)

		pmCli
			.command('blocked <id> [...notes]', 'Mark task blocked')
			.action((id: string, notes: string[] = []) => {
				cmdBlocked(id, notes.join(' '))
			})

		pmCli.command('ci', 'Run CI checks across all apps').action(async () => {
			await cmdCi()
		})

		pmCli.addEventListener('command:*', () => {
			console.error(`Error: Unknown command '${pmCli.args[0] ?? ''}'`)
			pmCli.outputHelp()
			process.exit(1)
		})

		pmCli.parse(process.argv.slice(2))
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
