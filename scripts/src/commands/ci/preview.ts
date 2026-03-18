import { cac } from 'cac'
import {
	createPreviews,
	cleanupPreviews,
	updatePreviewStatus,
	runPreviewGate,
} from '../../helpers/ci/preview.ts'

export function createCIPreviewCommand(): ReturnType<typeof cac> {
	const cli = cac('aamini ci preview')
	cli.help()
	cli.version('0.0.1')

	cli.command('create', 'Create preview deployments').action(async () => {
		const rawArgs = process.argv.slice(4)
		await createPreviews(rawArgs)
	})

	cli.command('cleanup', 'Cleanup preview deployments').action(async () => {
		const rawArgs = process.argv.slice(4)
		await cleanupPreviews(rawArgs)
	})

	cli.command('status', 'Update preview deployment status').action(async () => {
		const rawArgs = process.argv.slice(4)
		await updatePreviewStatus(rawArgs)
	})

	cli.command('gate', 'Wait for preview deployments').action(async () => {
		const rawArgs = process.argv.slice(4)
		await runPreviewGate(rawArgs)
	})

	cli.addEventListener('command:*', () => {
		console.error(`Error: Unknown command '${cli.args[0] ?? ''}'`)
		cli.outputHelp()
		process.exit(1)
	})

	return cli
}
