import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as dns from 'node:dns/promises'
import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { Command } from 'commander'
import { getRepoRoot, listAppDirectories } from '../helpers/repo.ts'

type SealTarget = {
	app: string
	appDir: string
	envFile: string
	output: string
}

type CommandResult = {
	stdout: string
}

type RunCommandInput = {
	command: string[]
	cwd: string
	input?: string
}

type SealAllOptions = {
	runCommand?: (input: RunCommandInput) => Promise<CommandResult>
}

type SealedSecretTemplateMetadata = {
	name: string
	namespace: string
}

export function createSecretsCommand(): Command {
	const cli = new Command('secrets')
	cli.description('Manage secrets')

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

	cli.action(() => {
		cli.outputHelp()
	})

	return cli
}

function findSealTargets(repoRoot: string): SealTarget[] {
	return listAppDirectories(repoRoot)
		.map((app) => {
			const appDir = path.join(repoRoot, 'apps', app)
			return {
				app,
				appDir,
				envFile: path.join(appDir, '.env.local'),
				output: path.join(appDir, 'k8s', 'sealed-secret.yaml'),
			}
		})
		.filter((target) => fs.existsSync(target.envFile))
}

function normalizeSealedSecretYaml(yaml: string, _app: string): string {
	return yaml
}

async function runCommandWithZx({
	command,
	cwd,
	input,
}: RunCommandInput): Promise<CommandResult> {
	return new Promise((resolve, reject) => {
		const child = spawn(command[0]!, command.slice(1), {
			cwd,
			stdio: 'pipe',
		})
		let stdout = ''
		let stderr = ''

		child.stdout.on('data', (chunk) => {
			stdout += chunk.toString()
		})
		child.stderr.on('data', (chunk) => {
			stderr += chunk.toString()
		})
		child.on('error', reject)
		child.on('close', (code) => {
			if (code === 0) {
				resolve({ stdout })
				return
			}
			reject(new Error(stderr.trim() || `Command failed: ${command.join(' ')}`))
		})

		if (input) {
			child.stdin.write(input)
		}
		child.stdin.end()
	})
}

async function fetchSealingCert(
	runCommand: (input: RunCommandInput) => Promise<CommandResult>,
	cwd: string,
): Promise<string> {
	const certResult = await runCommand({
		cwd,
		command: [
			'kubeseal',
			'--fetch-cert',
			'--controller-name=sealed-secrets',
			'--controller-namespace=kube-system',
		],
	})

	const certPath = path.join(
		os.tmpdir(),
		`sealed-secrets-cert-${randomUUID()}.pem`,
	)
	fs.writeFileSync(certPath, certResult.stdout)
	return certPath
}

export async function sealAll(
	repoRoot: string,
	{ runCommand = runCommandWithZx }: SealAllOptions = {},
): Promise<void> {
	const targets = findSealTargets(repoRoot)
	if (targets.length === 0) {
		throw new Error(
			'No .env.local files found in apps/*/.env.local. Create environment files before sealing.',
		)
	}

	let certPath = ''
	try {
		certPath = await fetchSealingCert(runCommand, repoRoot)
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		throw new Error(`Failed to fetch sealing cert: ${message}`)
	}

	for (const target of targets) {
		fs.mkdirSync(path.dirname(target.output), { recursive: true })

		console.log(`Sealing ${target.app}...`)

		try {
			const created = await runCommand({
				cwd: repoRoot,
				command: [
					'kubectl',
					'create',
					'secret',
					'generic',
					`${target.app}-secrets`,
					'--namespace',
					target.app,
					`--from-env-file=${target.envFile}`,
					'--dry-run=client',
					'-o',
					'yaml',
				],
			})

			const sealed = await runCommand({
				cwd: repoRoot,
				command: [
					'kubeseal',
					'--format=yaml',
					`--cert=${certPath}`,
					'--controller-name=sealed-secrets',
					'--controller-namespace=kube-system',
				],
				input: created.stdout,
			})

			fs.writeFileSync(
				target.output,
				normalizeSealedSecretYaml(sealed.stdout, target.app),
			)
			console.log(`Written to ${target.output}`)
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			throw new Error(`Failed to seal ${target.app}: ${message}`)
		}
	}

	try {
		fs.unlinkSync(certPath)
	} catch {
		/* ignore cleanup failures */
	}
}

function parseTemplateMetadata(
	sealedSecretFile: string,
): SealedSecretTemplateMetadata {
	const yaml = fs.readFileSync(sealedSecretFile, 'utf8')
	const lines = yaml.split(/\r?\n/)

	let templateIndent = -1
	let metadataIndent = -1
	let name = ''
	let namespace = ''

	for (const line of lines) {
		const templateMatch = line.match(/^(\s*)template:\s*$/)
		if (templateMatch) {
			templateIndent = templateMatch[1]?.length ?? 0
			metadataIndent = -1
			continue
		}

		if (templateIndent >= 0) {
			const indent = line.match(/^(\s*)/)?.[1]?.length ?? 0
			if (line.trim() && indent <= templateIndent) {
				templateIndent = -1
				metadataIndent = -1
				continue
			}

			const metadataMatch = line.match(/^(\s*)metadata:\s*$/)
			if (metadataMatch && indent > templateIndent) {
				metadataIndent = metadataMatch[1]?.length ?? 0
				continue
			}

			if (metadataIndent >= 0) {
				if (line.trim() && indent <= metadataIndent) {
					metadataIndent = -1
					continue
				}

				const nameMatch = line.match(/^\s*name:\s*(.+?)\s*$/)
				if (nameMatch) {
					name = nameMatch[1]?.trim() ?? ''
					continue
				}

				const namespaceMatch = line.match(/^\s*namespace:\s*(.+?)\s*$/)
				if (namespaceMatch) {
					namespace = namespaceMatch[1]?.trim() ?? ''
					continue
				}
			}
		}
	}

	return { name, namespace }
}

export async function unsealAll(repoRoot: string): Promise<void> {
	const { $ } = await import('zx')
	const contextResult = await $({
		cwd: repoRoot,
		nothrow: true,
		stdio: 'pipe',
	})`
		kubectl config current-context
	`
	const currentContext =
		contextResult.exitCode === 0 ? contextResult.stdout.trim() : ''

	const endpointResult = await $({
		cwd: repoRoot,
		nothrow: true,
		stdio: 'pipe',
	})`
		kubectl config view --minify -o jsonpath={.clusters[0].cluster.server}
	`
	const endpoint =
		endpointResult.exitCode === 0 ? endpointResult.stdout.trim() : ''

	if (!endpoint) {
		throw new Error(
			`No Kubernetes API endpoint found for context '${currentContext || 'unknown'}'. Refresh kubeconfig and retry \`aamini unseal\`.`,
		)
	}

	const endpointHost = new URL(endpoint).hostname
	try {
		await dns.lookup(endpointHost)
	} catch {
		throw new Error(
			[
				`kubectl context '${currentContext || 'unknown'}' points to an unreachable API host '${endpointHost}'.`,
				'Refresh kubeconfig for the active cluster (EKS after the refactor) and retry `aamini unseal`.',
			].join('\n'),
		)
	}

	const defaultSecretName = process.env.SEALED_SECRET_NAME ?? ''
	const defaultNamespace = process.env.SEALED_SECRET_NAMESPACE ?? ''

	for (const app of listAppDirectories(repoRoot)) {
		const appDir = path.join(repoRoot, 'apps', app)
		const sealedSecretFile = path.join(appDir, 'k8s', 'sealed-secret.yaml')
		const envFile = path.join(appDir, '.env.local')

		if (!fs.existsSync(sealedSecretFile)) {
			continue
		}

		const metadata = parseTemplateMetadata(sealedSecretFile)

		let secretName = defaultSecretName
		if (!secretName) {
			secretName = metadata.name
		}
		if (!secretName) {
			secretName = 'secrets'
		}

		let namespace = defaultNamespace
		if (!namespace) {
			namespace = metadata.namespace
		}
		if (!namespace) {
			namespace = app
		}

		console.log(`Unsealing ${app}...`)
		const exists = await $({ cwd: repoRoot, nothrow: true, stdio: 'pipe' })`
			kubectl get secret ${secretName} --namespace ${namespace}
		`

		if (exists.exitCode !== 0) {
			console.log(
				`Skipping ${app}: secret '${secretName}' not found in namespace '${namespace}'`,
			)
			continue
		}

		const secretResult = await $({ cwd: repoRoot, stdio: 'pipe' })`
			kubectl get secret ${secretName} --namespace ${namespace} -o json
		`
		const secret = JSON.parse(secretResult.stdout) as {
			data?: Record<string, string>
		}

		const entries = Object.entries(secret.data ?? [])
			.sort(([a], [b]) => a.localeCompare(b))
			.map(
				([key, value]) =>
					`${key}=${Buffer.from(value, 'base64').toString('utf8')}`,
			)

		fs.writeFileSync(envFile, `${entries.join('\n')}\n`)
		console.log(`Written to ${envFile}`)
	}
}

function parseApps(repoRoot: string, args: string[]): string[] {
	const runAll = args.includes('--all')
	const positionalArgs = args.filter((arg) => arg !== '--all')

	if (runAll) {
		return listAppDirectories(repoRoot)
	}

	const appName = positionalArgs[0]
	if (!appName) {
		throw new Error(
			'Usage: aamini secrets <seal|unseal> [app-name] | aamini secrets <seal|unseal> --all',
		)
	}

	return [appName]
}

async function updateAll(_repoRoot: string): Promise<void> {
	console.log('aamini secrets update is a stub - implementation empty for now')
}

export {
	findSealTargets,
	normalizeSealedSecretYaml,
	parseApps,
	parseTemplateMetadata,
	updateAll,
}
