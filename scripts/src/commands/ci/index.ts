import { cac } from 'cac'
import { createCIPreviewCommand } from './preview.ts'
import { createCIEventsCommand } from './events.ts'
import { createCIE2ECommand } from './e2e.ts'

export function createCICommand(): ReturnType<typeof cac> {
	const cli = cac('aamini ci')
	cli.version('0.0.1')
	cli.help()

	cli.command('').action(() => {
		cli.outputHelp()
	})

	cli.command('preview', 'Run CI preview').action(() => {
		const ciPreviewCli = createCIPreviewCommand()
		ciPreviewCli.parse(process.argv.slice(3))
	})

	cli.command('events', 'Handle CI events').action(() => {
		const ciEventsCli = createCIEventsCommand()
		ciEventsCli.parse(process.argv.slice(3))
	})

	cli.command('e2e', 'Run CI e2e tests').action(() => {
		const ciE2eCli = createCIE2ECommand()
		ciE2eCli.parse(process.argv.slice(3))
	})

	return cli
}
