import { cac } from 'cac'
import { updateE2eStatus } from '../../helpers/ci/e2e.ts'

export function createCIE2ECommand(): ReturnType<typeof cac> {
	const cli = cac('aamini ci e2e')
	cli.help()
	cli.version('0.0.1')

	cli.command('status', 'Update e2e status').action(async () => {
		const rawArgs = process.argv.slice(5)
		await updateE2eStatus(rawArgs)
	})

	cli.addEventListener('command:*', () => {
		console.error(`Error: Unknown command '${cli.args[0] ?? ''}'`)
		cli.outputHelp()
		process.exit(1)
	})

	return cli
}
