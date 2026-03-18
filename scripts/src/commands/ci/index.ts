import { cac } from 'cac'
import { createCIPreviewCommand } from './preview.ts'
import { createCIEventsCommand } from './events.ts'
import { createCIE2ECommand } from './e2e.ts'

export function createCICommand(): ReturnType<typeof cac> {
	const cli = cac('aamini ci')
	cli.version('0.0.1')

	cli
		.command('preview', 'Run CI preview')
		.allowUnknownOptions()
		.action(() => {
			const ciPreviewCli = createCIPreviewCommand()
			ciPreviewCli.parse(process.argv.slice(3))
		})

	cli
		.command('events', 'Handle CI events')
		.allowUnknownOptions()
		.action(() => {
			const ciEventsCli = createCIEventsCommand()
			ciEventsCli.parse(process.argv.slice(3))
		})

	cli
		.command('e2e', 'Run CI e2e tests')
		.allowUnknownOptions()
		.action(() => {
			const ciE2eCli = createCIE2ECommand()
			ciE2eCli.parse(process.argv.slice(3))
		})

	cli.addEventListener('command:*', () => {
		console.error(`Error: Unknown ci command`)
		cli.outputHelp()
		process.exit(1)
	})

	return cli
}
