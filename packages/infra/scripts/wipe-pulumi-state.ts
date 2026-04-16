import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const projectDir = process.cwd()
const backupDir = join(projectDir, '.pulumi-state-backups')

type StackResource = {
	type: string
	inputs?: Record<string, unknown>
	outputs?: Record<string, unknown>
	initErrors?: string[]
	pendingReplacement?: boolean

	[key: string]: unknown
}

type StackExport = {
	version: number
	deployment: {
		manifest: Record<string, unknown>
		secrets_providers?: Record<string, unknown>
		resources: StackResource[]
		pending_operations?: unknown[]
		metadata?: Record<string, unknown>
	}
}

function run(command: string, args: string[]) {
	const result = spawnSync(command, args, {
		cwd: projectDir,
		encoding: 'utf8',
	})

	if (result.status !== 0) {
		throw new Error(
			[
				`Command failed: ${command} ${args.join(' ')}`,
				result.stderr.trim() || result.stdout.trim(),
			]
				.filter(Boolean)
				.join('\n'),
		)
	}

	return result.stdout.trim()
}

function sanitizeStackResource(resource: StackResource) {
	const nextResource = { ...resource }
	delete nextResource.id
	delete nextResource.external
	delete nextResource.dependencies
	delete nextResource.propertyDependencies
	delete nextResource.provider
	delete nextResource.parent
	delete nextResource.outputs
	delete nextResource.initErrors
	delete nextResource.pendingReplacement
	delete nextResource.created
	delete nextResource.modified
	return nextResource
}

async function confirm(stackName: string) {
	if (process.env.PULUMI_WIPE_STATE_CONFIRM === stackName) {
		return
	}

	const rl = createInterface({ input, output })
	const answer = await rl.question(
		`Type '${stackName}' to wipe its tracked resources from Pulumi state: `,
	)
	rl.close()

	if (answer.trim() !== stackName) {
		throw new Error('Aborted state wipe.')
	}
}

async function main() {
	const stackName = run('pulumi', ['stack', '--show-name'])
	await confirm(stackName)

	const exportJson = run('pulumi', ['stack', 'export', '--show-secrets'])
	const checkpoint = JSON.parse(exportJson) as StackExport
	const stackResource = checkpoint.deployment.resources.find(
		(resource) => resource.type === 'pulumi:pulumi:Stack',
	)

	if (!stackResource) {
		throw new Error('Pulumi stack resource not found in checkpoint export.')
	}

	const wipedCheckpoint: StackExport = {
		...checkpoint,
		deployment: {
			...checkpoint.deployment,
			resources: [sanitizeStackResource(stackResource)],
			pending_operations: [],
		},
	}

	await mkdir(backupDir, { recursive: true })
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
	const backupPath = join(backupDir, `${stackName}-${timestamp}.json`)
	const importPath = join(backupDir, `${stackName}-wiped-${timestamp}.json`)

	await writeFile(
		backupPath,
		`${JSON.stringify(checkpoint, null, 2)}\n`,
		'utf8',
	)
	await writeFile(
		importPath,
		`${JSON.stringify(wipedCheckpoint, null, 2)}\n`,
		'utf8',
	)

	run('pulumi', ['stack', 'import', '--file', importPath])

	output.write(`Backed up checkpoint to ${backupPath}\n`)
	output.write(`Imported wiped checkpoint from ${importPath}\n`)
	output.write(
		'Pulumi state is now empty except for the stack shell. Cloud resources were not destroyed.\n',
	)
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error)
	console.error(message)
	process.exitCode = 1
})
