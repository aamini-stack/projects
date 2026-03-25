import path from 'node:path'

import { renderGitopsBundle } from '../lib/gitops/render-bundle.ts'

function main(): void {
	const sourceRoot = path.resolve(process.cwd(), 'gitops')
	const outputRoot = path.resolve(process.cwd(), 'dist', 'gitops')
	const appManifestRoot = process.cwd()

	renderGitopsBundle({ sourceRoot, outputRoot, appManifestRoot })
	console.log(`Rendered GitOps bundle to ${outputRoot}`)
}

try {
	main()
} catch (error: unknown) {
	const message = error instanceof Error ? error.message : String(error)
	console.error(`GitOps render failed: ${message}`)
	process.exit(1)
}
