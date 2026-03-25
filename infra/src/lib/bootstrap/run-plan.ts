import * as auto from '@pulumi/pulumi/automation/index.js'

import { execText, withTempKubeconfig } from '../runtime.ts'
const RETRY_BASE_DELAY_MS = 5_000
import type { BootstrapPlan, StackDefinition, StackOperation } from './types.ts'

function toConfigMap(
	config: Record<string, { value: string; secret?: boolean }>,
): auto.ConfigMap {
	return Object.fromEntries(Object.entries(config))
}

function getWorkspaceEnv(
	profile: string,
	region: string,
	dockerConfigDir?: string,
): Record<string, string> {
	return {
		AWS_PROFILE: profile,
		AWS_REGION: region,
		AWS_DEFAULT_REGION: region,
		...(dockerConfigDir ? { DOCKER_CONFIG: dockerConfigDir } : {}),
	}
}

function nowIso(): string {
	return new Date().toISOString()
}

function formatDurationMs(durationMs: number): string {
	const seconds = Math.round(durationMs / 1_000)
	return `${seconds}s`
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolveSleep) => {
		setTimeout(resolveSleep, ms)
	})
}

function isStackNotFoundError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false
	}

	const message = error.message.toLowerCase()
	return (
		message.includes('stack') &&
		(message.includes('not found') ||
			message.includes('does not exist') ||
			message.includes('no stack named'))
	)
}

function isTimeoutError(error: unknown): boolean {
	return (
		error instanceof Error && error.message.toLowerCase().includes('timed out')
	)
}

function isTransientStackError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false
	}

	const message = error.message.toLowerCase()
	return (
		message.includes('throttl') ||
		message.includes('rate exceeded') ||
		message.includes('too many requests') ||
		message.includes('timeout') ||
		message.includes('connection reset') ||
		message.includes('connection refused') ||
		message.includes('temporarily unavailable') ||
		message.includes('request limit exceeded') ||
		message.includes('internal error')
	)
}

async function runWithTimeout<T>(
	stackLabel: string,
	operation: StackOperation,
	timeoutMs: number,
	operationFn: () => Promise<T>,
): Promise<T> {
	let timeoutHandle: NodeJS.Timeout | undefined

	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutHandle = setTimeout(() => {
			reject(
				new Error(
					`${operation} timed out after ${formatDurationMs(timeoutMs)} for ${stackLabel}`,
				),
			)
		}, timeoutMs)
	})

	try {
		return await Promise.race([operationFn(), timeoutPromise])
	} finally {
		if (timeoutHandle) {
			clearTimeout(timeoutHandle)
		}
	}
}

async function runStackOperationWithRetry(
	stackLabel: string,
	operation: StackOperation,
	timeoutMs: number,
	retries: number,
	operationFn: () => Promise<void>,
): Promise<void> {
	const attempts = retries + 1

	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		const startedAt = Date.now()
		console.log(
			`[${nowIso()}] ${operation} start: ${stackLabel} (attempt ${attempt}/${attempts})`,
		)

		try {
			await runWithTimeout(stackLabel, operation, timeoutMs, operationFn)
			console.log(
				`[${nowIso()}] ${operation} complete: ${stackLabel} (${formatDurationMs(
					Date.now() - startedAt,
				)})`,
			)
			return
		} catch (error: unknown) {
			const canRetry =
				attempt < attempts &&
				(isTransientStackError(error) || isTimeoutError(error))
			if (!canRetry) {
				throw error
			}

			const waitMs = RETRY_BASE_DELAY_MS * attempt
			const message = error instanceof Error ? error.message : String(error)
			console.log(
				`[${nowIso()}] ${operation} retry: ${stackLabel} in ${Math.round(
					waitMs / 1_000,
				)}s (${message})`,
			)
			await sleep(waitMs)
		}
	}
}

function runBestEffortCommand(
	command: string,
	args: string[],
	env: NodeJS.ProcessEnv,
): void {
	try {
		execText({ cmd: command, args, env })
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error)
		console.log(
			`- warning: ${command} ${args.join(' ')} failed during cleanup (${message})`,
		)
	}
}

async function runFluxPreDestroyCleanup(
	stack: auto.Stack,
	stackDef: StackDefinition,
	profile: string,
	region: string,
): Promise<void> {
	const outputs = await stack.outputs()
	const kubeconfigOutput = outputs.kubeconfig?.value
	if (typeof kubeconfigOutput !== 'string' || kubeconfigOutput.length === 0) {
		console.log(
			`- flux pre-destroy: skipped for ${stackDef.key} (missing kubeconfig output)`,
		)
		return
	}

	withTempKubeconfig(kubeconfigOutput, (kubeconfigPath) => {
		const commandEnv: NodeJS.ProcessEnv = {
			...process.env,
			AWS_PROFILE: profile,
			AWS_REGION: region,
			AWS_DEFAULT_REGION: region,
			KUBECONFIG: kubeconfigPath,
		}

		console.log(
			`- flux pre-destroy: uninstalling Flux resources for ${stackDef.key}`,
		)
		runBestEffortCommand(
			'helm',
			['uninstall', 'flux-instance', '-n', 'flux-system'],
			commandEnv,
		)
		runBestEffortCommand(
			'helm',
			['uninstall', 'flux-operator', '-n', 'flux-system'],
			commandEnv,
		)
		runBestEffortCommand(
			'kubectl',
			['delete', 'namespace', 'flux-system', '--wait=false'],
			commandEnv,
		)
		runBestEffortCommand(
			'kubectl',
			[
				'patch',
				'namespace',
				'flux-system',
				'--type',
				'merge',
				'-p',
				'{"spec":{"finalizers":[]}}',
			],
			commandEnv,
		)
	})
}

function includesPlatform(stacks: StackDefinition[]): boolean {
	return stacks.some((stack) => stack.project === 'platform')
}

async function upOrPreviewStack(
	org: string,
	stackDef: StackDefinition,
	previewOnly: boolean,
	profile: string,
	region: string,
	stackOperationTimeoutMs: number,
	stackOperationRetries: number,
	dockerConfigDir?: string,
): Promise<void> {
	const stackName = `${org}/${stackDef.stack}`
	const stackLabel = `${stackDef.key} (${stackName})`
	const stack = await auto.LocalWorkspace.createOrSelectStack(
		{
			stackName,
			workDir: stackDef.workDir,
		},
		{
			envVars: getWorkspaceEnv(profile, region, dockerConfigDir),
		},
	)

	await stack.setAllConfig(toConfigMap(stackDef.config))
	console.log(`Configured ${stackLabel}`)

	if (previewOnly) {
		await runStackOperationWithRetry(
			stackLabel,
			'preview',
			stackOperationTimeoutMs,
			stackOperationRetries,
			async () => {
				await stack.preview({
					onOutput: (line: string) => process.stdout.write(`${line}\n`),
				})
			},
		)
		return
	}

	await runStackOperationWithRetry(
		stackLabel,
		'up',
		stackOperationTimeoutMs,
		stackOperationRetries,
		async () => {
			await stack.up({
				onOutput: (line: string) => process.stdout.write(`${line}\n`),
			})
		},
	)
}

async function destroyOrPreviewDestroyStack(
	org: string,
	stackDef: StackDefinition,
	previewOnly: boolean,
	removeStacks: boolean,
	profile: string,
	region: string,
	stackOperationTimeoutMs: number,
	stackOperationRetries: number,
	dockerConfigDir?: string,
): Promise<void> {
	const stackName = `${org}/${stackDef.stack}`
	const stackLabel = `${stackDef.key} (${stackName})`
	let stack: auto.Stack

	try {
		stack = await auto.LocalWorkspace.selectStack(
			{
				stackName,
				workDir: stackDef.workDir,
			},
			{
				envVars: getWorkspaceEnv(profile, region, dockerConfigDir),
			},
		)
	} catch (error: unknown) {
		if (isStackNotFoundError(error)) {
			console.log(`Skipping missing stack ${stackLabel}`)
			return
		}

		throw error
	}

	await stack.setAllConfig(toConfigMap(stackDef.config))

	if (previewOnly) {
		await runStackOperationWithRetry(
			stackLabel,
			'preview-destroy',
			stackOperationTimeoutMs,
			stackOperationRetries,
			async () => {
				await stack.previewDestroy({
					onOutput: (line: string) => process.stdout.write(`${line}\n`),
				})
			},
		)
		return
	}

	if (stackDef.project === 'platform') {
		await runFluxPreDestroyCleanup(stack, stackDef, profile, region)
	}

	await runStackOperationWithRetry(
		stackLabel,
		'destroy',
		stackOperationTimeoutMs,
		stackOperationRetries,
		async () => {
			await stack.destroy({
				remove: removeStacks,
				onOutput: (line: string) => process.stdout.write(`${line}\n`),
			})
		},
	)

	console.log(
		removeStacks
			? `Destroyed and removed stack ${stackDef.key}`
			: `Destroyed resources for stack ${stackDef.key}`,
	)
}

export async function runBootstrapPlan(plan: BootstrapPlan): Promise<void> {
	const { context, executionPlan } = plan

	if (context.dryRun) {
		if (context.check) {
			console.log(
				'Check mode enabled. Preflight completed; no Pulumi operations were run.',
			)
			return
		}

		console.log('Dry run enabled. Skipping all Pulumi operations.')
		return
	}

	let dockerConfigDir: string | undefined
	if (includesPlatform(executionPlan)) {
		const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs')
		const { tmpdir } = await import('node:os')
		const { resolve } = await import('node:path')
		dockerConfigDir = mkdtempSync(resolve(tmpdir(), 'bootstrap-docker-config-'))
		writeFileSync(
			resolve(dockerConfigDir, 'config.json'),
			JSON.stringify({ auths: {} }),
		)

		try {
			for (const stack of executionPlan) {
				if (context.command === 'destroy') {
					await destroyOrPreviewDestroyStack(
						context.org,
						stack,
						context.preview,
						context.removeStacks,
						context.profile,
						context.region,
						context.stackOperationTimeoutMs,
						context.stackOperationRetries,
						dockerConfigDir,
					)
					continue
				}

				await upOrPreviewStack(
					context.org,
					stack,
					context.preview,
					context.profile,
					context.region,
					context.stackOperationTimeoutMs,
					context.stackOperationRetries,
					dockerConfigDir,
				)
			}
		} finally {
			rmSync(dockerConfigDir, { force: true, recursive: true })
		}
	} else {
		for (const stack of executionPlan) {
			if (context.command === 'destroy') {
				await destroyOrPreviewDestroyStack(
					context.org,
					stack,
					context.preview,
					context.removeStacks,
					context.profile,
					context.region,
					context.stackOperationTimeoutMs,
					context.stackOperationRetries,
				)
				continue
			}

			await upOrPreviewStack(
				context.org,
				stack,
				context.preview,
				context.profile,
				context.region,
				context.stackOperationTimeoutMs,
				context.stackOperationRetries,
			)
		}
	}

	console.log('Bootstrap complete.')
}
