#!/usr/bin/env node
import path from 'node:path'
import { mkdirSync } from 'node:fs'
import { renderGitopsBundle } from '../../packages/infra/src/gitops/render.ts'
import { getRepoRoot } from './helpers/repo.ts'

interface RenderCommandOptions {
	deployRevision?: string
	outputRoot: string
}

function parseArgs(args: string[]): {
	command: string | undefined
	options: RenderCommandOptions
} {
	const options: RenderCommandOptions = {
		outputRoot: '.tmp/gitops-bundle',
	}

	for (let index = 1; index < args.length; index += 1) {
		const arg = args[index]
		if (arg === '--output-root') {
			const value = args[index + 1]
			if (!value) {
				throw new Error('Missing value for --output-root')
			}

			options.outputRoot = value
			index += 1
			continue
		}
		if (arg === '--deploy-revision') {
			const value = args[index + 1]
			if (!value) {
				throw new Error('Missing value for --deploy-revision')
			}

			options.deployRevision = value
			index += 1
			continue
		}

		throw new Error(`Unknown argument: ${arg}`)
	}

	return {
		command: args[0],
		options,
	}
}

async function renderCommand(options: RenderCommandOptions): Promise<void> {
	const repoRoot = await getRepoRoot()
	const sourceRoot = path.join(repoRoot, 'packages', 'infra', 'manifests')
	const outputRoot = path.join(repoRoot, options.outputRoot)

	mkdirSync(path.dirname(outputRoot), { recursive: true })
	renderGitopsBundle({
		sourceRoot,
		outputRoot,
		appManifestRoot: repoRoot,
		...(options.deployRevision
			? { deployRevision: options.deployRevision }
			: {}),
	})
	console.log(outputRoot)
}

async function main(): Promise<void> {
	const { command, options } = parseArgs(process.argv.slice(2))

	if (command === 'render') {
		await renderCommand(options)
		return
	}

	throw new Error(
		'Usage: publish-gitops.ts render [--output-root <path>] [--deploy-revision <sha>]',
	)
}

if (process.argv[1] === import.meta.url.replace('file://', '')) {
	void main().catch((error: unknown) => {
		if (error instanceof Error) {
			console.error(error.message)
		} else {
			console.error(error)
		}
		process.exit(1)
	})
}

export { main }
