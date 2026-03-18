import { $ } from 'zx'
import * as path from 'node:path'
import { mkdirSync } from 'node:fs'
import { Command } from 'commander'
import { getRepoRoot } from '../helpers/repo.ts'

interface DeployOptions {
	production?: boolean
	preview?: boolean
	prNumber?: string
	sha: string
	app?: string
}

export function createDeployCommand(): Command {
	const cli = new Command('deploy')
	cli.description('Deploy apps to Kubernetes via GitOps')

	cli
		.command('gitops')
		.description('Deploy GitOps manifests for an app')
		.option('--production', 'Deploy to production environment')
		.option('--preview', 'Deploy to preview environment')
		.option(
			'--pr-number <number>',
			'Pull request number (required for preview)',
		)
		.requiredOption('--sha <sha>', 'Git commit SHA')
		.option('--app <app>', 'App name (defaults to portfolio)')
		.action(async (options: DeployOptions) => {
			if (!options.production && !options.preview) {
				console.error('Error: Must specify either --production or --preview')
				process.exit(1)
			}

			if (options.production && options.preview) {
				console.error('Error: Cannot specify both --production and --preview')
				process.exit(1)
			}

			if (options.preview && !options.prNumber) {
				console.error('Error: --pr-number is required for preview deployments')
				process.exit(1)
			}

			const app = options.app ?? 'portfolio'
			const repoRoot = await getRepoRoot()

			if (options.production) {
				await deployProduction(repoRoot, app, options.sha)
			} else {
				await deployPreview(repoRoot, app, options.sha, options.prNumber!)
			}
		})

	cli.action(() => {
		cli.outputHelp()
	})

	return cli
}

async function deployProduction(
	repoRoot: string,
	app: string,
	sha: string,
): Promise<void> {
	console.log(`🚀 Deploying ${app} to PRODUCTION (sha: ${sha})`)

	const ecrRegistry = process.env.ECR_REGISTRY
	if (!ecrRegistry) {
		throw new Error('ECR_REGISTRY environment variable is required')
	}

	const fluxReceiverUrl = process.env.FLUX_RECEIVER_URL
	if (!fluxReceiverUrl) {
		throw new Error('FLUX_RECEIVER_URL environment variable is required')
	}

	// Step 1: Render GitOps bundle
	console.log('📦 Rendering GitOps bundle...')
	const { renderGitopsBundle } = await import(
		// @ts-ignore - external package import
		'../../../../packages/infra/src/gitops/render.ts'
	)
	const sourceRoot = path.join(repoRoot, 'packages', 'infra', 'manifests')
	const outputRoot = path.join(repoRoot, '.tmp/gitops-bundle')

	mkdirSync(path.dirname(outputRoot), { recursive: true })
	renderGitopsBundle({
		sourceRoot,
		outputRoot,
		appManifestRoot: repoRoot,
		deployRevision: sha,
	})
	console.log(`   Bundle rendered to: ${outputRoot}`)

	// Step 2: Package and push app-release chart
	console.log('📋 Packaging app-release Helm chart...')
	const chartDir = path.join(repoRoot, '.tmp/chart')
	mkdirSync(chartDir, { recursive: true })
	await $({
		cwd: repoRoot,
	})`helm package packages/infra/charts/app-release --destination ${chartDir}`
	await $({
		cwd: repoRoot,
	})`helm push ${chartDir}/app-release-0.1.0.tgz oci://${ecrRegistry}`
	console.log('   Chart pushed successfully')

	// Step 3: Push GitOps OCI bundle
	console.log('📤 Pushing GitOps OCI bundle...')
	const bundlePath = path.join(repoRoot, '.tmp/projects-gitops.tar.gz')
	await $({ cwd: repoRoot })`tar -C ${outputRoot} -czf ${bundlePath} .`
	await $({
		cwd: repoRoot,
	})`oras push ${ecrRegistry}/projects-gitops:main-${sha} ${bundlePath}:application/vnd.aamini.gitops.bundle.v1+tar.gz`
	console.log('   Bundle pushed successfully')

	// Step 4: Notify Flux receiver
	console.log('🔔 Notifying Flux receiver...')
	await notifyFluxReceiver(fluxReceiverUrl, sha)
	console.log('   Flux notified successfully')

	console.log(`✅ Production deployment complete for ${app}`)
}

async function deployPreview(
	repoRoot: string,
	app: string,
	sha: string,
	prNumber: string,
): Promise<void> {
	console.log(`🚀 Deploying ${app} to PREVIEW (pr: ${prNumber}, sha: ${sha})`)

	const ecrRegistry = process.env.ECR_REGISTRY
	if (!ecrRegistry) {
		throw new Error('ECR_REGISTRY environment variable is required')
	}

	const fluxReceiverUrl = process.env.FLUX_RECEIVER_URL
	if (!fluxReceiverUrl) {
		throw new Error('FLUX_RECEIVER_URL environment variable is required')
	}

	// Step 1: Render GitOps bundle with preview-specific configuration
	console.log('📦 Rendering GitOps bundle for preview...')
	const { renderGitopsBundle } = await import(
		// @ts-ignore - external package import
		'../../../../packages/infra/src/gitops/render.ts'
	)
	const sourceRoot = path.join(repoRoot, 'packages', 'infra', 'manifests')
	const outputRoot = path.join(repoRoot, '.tmp/gitops-bundle')

	mkdirSync(path.dirname(outputRoot), { recursive: true })
	renderGitopsBundle({
		sourceRoot,
		outputRoot,
		appManifestRoot: repoRoot,
		deployRevision: sha,
		prNumber: prNumber,
	})
	console.log(`   Bundle rendered to: ${outputRoot}`)

	// Step 2: Package and push app-release chart (shared between prod and preview)
	console.log('📋 Packaging app-release Helm chart...')
	const chartDir = path.join(repoRoot, '.tmp/chart')
	mkdirSync(chartDir, { recursive: true })
	await $({
		cwd: repoRoot,
	})`helm package packages/infra/charts/app-release --destination ${chartDir}`
	await $({
		cwd: repoRoot,
	})`helm push ${chartDir}/app-release-0.1.0.tgz oci://${ecrRegistry}`
	console.log('   Chart pushed successfully')

	// Step 3: Push GitOps OCI bundle with PR-specific tag
	console.log('📤 Pushing GitOps OCI bundle...')
	const bundlePath = path.join(repoRoot, '.tmp/projects-gitops.tar.gz')
	await $({ cwd: repoRoot })`tar -C ${outputRoot} -czf ${bundlePath} .`
	await $({
		cwd: repoRoot,
	})`oras push ${ecrRegistry}/projects-gitops:pr-${prNumber} ${bundlePath}:application/vnd.aamini.gitops.bundle.v1+tar.gz`
	console.log('   Bundle pushed successfully')

	// Step 4: Notify Flux receiver
	console.log('🔔 Notifying Flux receiver...')
	await notifyFluxReceiver(fluxReceiverUrl, sha, prNumber)
	console.log('   Flux notified successfully')

	console.log(`✅ Preview deployment complete for ${app} (PR #${prNumber})`)
}

async function notifyFluxReceiver(
	fluxReceiverUrl: string,
	sha: string,
	prNumber?: string,
): Promise<void> {
	const maxAttempts = 6
	let delaySeconds = 10

	const payload = {
		source: 'github-actions',
		workflow: 'deploy',
		run_id: process.env.GITHUB_RUN_ID ?? 'unknown',
		sha: sha,
		...(prNumber ? { pr_number: prNumber } : {}),
	}

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const response = await fetch(fluxReceiverUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})

			if (response.ok) {
				console.log(`   Flux receiver acknowledged (HTTP ${response.status})`)
				return
			}

			if (response.status === 404) {
				console.log('   Warning: Flux receiver returned 404, skipping retries')
				return
			}

			if (attempt >= maxAttempts) {
				console.log(
					`   Warning: Flux receiver unavailable after ${maxAttempts} attempts`,
				)
				return
			}

			console.log(
				`   Attempt ${attempt}/${maxAttempts} failed (HTTP ${response.status}), retrying in ${delaySeconds}s...`,
			)
			await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000))
			delaySeconds *= 2
		} catch (error) {
			if (attempt >= maxAttempts) {
				console.log(
					`   Warning: Flux receiver error after ${maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`,
				)
				return
			}
			console.log(
				`   Attempt ${attempt}/${maxAttempts} error, retrying in ${delaySeconds}s...`,
			)
			await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000))
			delaySeconds *= 2
		}
	}
}
