import { cac } from 'cac'
import { getRepoRoot } from '../helpers/repo.ts'
import { sealAll, unsealAll, updateAll } from '../helpers/secrets.ts'

export function createSecretsCommand(): ReturnType<typeof cac> {
	const cli = cac('aamini secrets')
	cli.version('0.0.1')

	cli.command('seal', 'Seal all app secrets').action(async () => {
		const repoRoot = await getRepoRoot()
		await sealAll(repoRoot)
	})

	cli.command('unseal', 'Unseal all app secrets').action(async () => {
		const repoRoot = await getRepoRoot()
		await unsealAll(repoRoot)
	})

	cli.command('update', 'Update all sealed secrets').action(async () => {
		const repoRoot = await getRepoRoot()
		await updateAll(repoRoot)
	})

	cli.addEventListener('command:*', () => {
		console.error(`Error: Unknown secrets command`)
		cli.outputHelp()
		process.exit(1)
	})

	return cli
}
