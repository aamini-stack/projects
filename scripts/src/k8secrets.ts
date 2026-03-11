import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { $ } from 'zx'
import { listAppDirectories } from './helpers/repo.ts'

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

async function sealAll(
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

async function unsealAll(repoRoot: string): Promise<void> {
	const defaultSecretName = process.env.SEALED_SECRET_NAME ?? ''
	const defaultNamespace = process.env.SEALED_SECRET_NAMESPACE ?? ''

	for (const app of listAppDirectories(repoRoot)) {
		const appDir = path.join(repoRoot, 'apps', app)
		const sealedSecretFile = path.join(appDir, 'k8s', 'sealed-secret.yaml')
		const envFile = path.join(appDir, '.env.local')

		if (!fs.existsSync(sealedSecretFile)) {
			continue
		}

		let secretName = defaultSecretName
		if (!secretName) {
			const nameResult = await $({
				cwd: repoRoot,
				nothrow: true,
				stdio: 'pipe',
			})`kubectl create --dry-run=client -f ${sealedSecretFile} -o jsonpath={.spec.template.metadata.name}`
			secretName = nameResult.exitCode === 0 ? nameResult.stdout.trim() : ''
		}
		if (!secretName) {
			secretName = 'secrets'
		}

		let namespace = defaultNamespace
		if (!namespace) {
			const namespaceResult = await $({
				cwd: repoRoot,
				nothrow: true,
				stdio: 'pipe',
			})`kubectl create --dry-run=client -f ${sealedSecretFile} -o jsonpath={.spec.template.metadata.namespace}`
			namespace =
				namespaceResult.exitCode === 0 ? namespaceResult.stdout.trim() : ''
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

		const entries = Object.entries(secret.data ?? {})
			.sort(([a], [b]) => a.localeCompare(b))
			.map(
				([key, value]) =>
					`${key}=${Buffer.from(value, 'base64').toString('utf8')}`,
			)

		fs.writeFileSync(envFile, `${entries.join('\n')}\n`)
		console.log(`Written to ${envFile}`)
	}
}

export { findSealTargets, normalizeSealedSecretYaml, sealAll, unsealAll }
