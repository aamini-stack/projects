import { cac } from 'cac'
import { writeOutputs, normalizeEvent } from '../../helpers/ci/events.ts'

export function createCIEventsCommand(): ReturnType<typeof cac> {
	const cli = cac('aamini ci events')
	cli.help()
	cli.version('0.0.1')

	cli
		.command('outputs', 'Write event outputs to GitHub Actions')
		.action(async () => {
			const rawArgs = process.argv.slice(5)
			await writeOutputs(rawArgs)
		})

	cli.command('normalize', 'Normalize an event file').action(async () => {
		const rawArgs = process.argv.slice(5)
		const normalized = normalizeEvent(rawArgs)
		console.log(JSON.stringify(normalized))
	})

	cli.addEventListener('command:*', () => {
		console.error(`Error: Unknown command '${cli.args[0] ?? ''}'`)
		cli.outputHelp()
		process.exit(1)
	})

	return cli
}
