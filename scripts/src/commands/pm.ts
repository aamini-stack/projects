#!/usr/bin/env node
import { cac } from 'cac'
import {
	cmdBlocked,
	cmdCi,
	cmdDone,
	cmdDoneJson,
	cmdNext,
	cmdProgress,
	cmdShow,
	cmdUpdate,
	cmdWipe,
	readFromStdin,
} from '../helpers/pm.ts'

async function main(): Promise<void> {
	const cli = cac('aamini pm')
	cli.help()
	cli.version('0.0.1')

	cli.command('next', 'Show next available tasks').action(() => {
		cmdNext()
	})

	cli.command('progress', 'Show task progress').action(() => {
		cmdProgress()
	})

	cli.command('wipe', 'Wipe all progress fields').action(() => {
		cmdWipe()
	})

	cli.command('show <id>', 'Show details for a task').action((id: string) => {
		cmdShow(id)
	})

	cli
		.command('update <id> <field> [...value]', 'Update task field')
		.action((id: string, field: string, value: string[] = []) => {
			if (value.length === 0) {
				console.error('Error: Usage: aamini pm update <id> <field> <value>')
				process.exit(1)
			}
			cmdUpdate(id, field, value.join(' '))
		})

	cli
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
					console.error('       or: echo \'{"task": 1, ...}\' | aamini pm done')
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

	cli
		.command('blocked <id> [...notes]', 'Mark task blocked')
		.action((id: string, notes: string[] = []) => {
			cmdBlocked(id, notes.join(' '))
		})

	cli.command('ci', 'Run CI checks across all apps').action(async () => {
		await cmdCi()
	})

	cli.addEventListener('command:*', () => {
		console.error(`Error: Unknown command '${cli.args[0] ?? ''}'`)
		cli.outputHelp()
		process.exit(1)
	})

	cli.parse()
}

if (process.argv[1] === import.meta.url.replace('file://', '')) {
	void main()
}
