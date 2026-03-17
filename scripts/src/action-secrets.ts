import * as fs from 'node:fs'
import * as path from 'node:path'
import { spawn } from 'node:child_process'
import { $ } from 'zx'

type ActionSecret = {
	name: string
	value: string
}

type UpdateActionSecretsOptions = {
	resolveRepo?: (repoRoot: string, explicitRepo?: string) => Promise<string>
	setSecret?: (input: {
		repo: string
		name: string
		value: string
		cwd: string
	}) => Promise<void>
}

function parseEnvValue(rawValue: string): string {
	const value = rawValue.trim()

	if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
		const inner = value.slice(1, -1)
		return inner
			.replace(/\\n/g, '\n')
			.replace(/\\r/g, '\r')
			.replace(/\\t/g, '\t')
			.replace(/\\"/g, '"')
			.replace(/\\\\/g, '\\')
	}

	if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
		return value.slice(1, -1)
	}

	return value
}

function parseEnvLocal(content: string): ActionSecret[] {
	const lines = content.split(/\r?\n/)
	const parsed = new Map<string, string>()

	for (const line of lines) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) {
			continue
		}

		const withoutExport = trimmed.startsWith('export ')
			? trimmed.slice('export '.length).trim()
			: trimmed

		const separatorIndex = withoutExport.indexOf('=')
		if (separatorIndex <= 0) {
			continue
		}

		const key = withoutExport.slice(0, separatorIndex).trim()
		if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
			continue
		}

		const valuePart = withoutExport.slice(separatorIndex + 1)
		parsed.set(key, parseEnvValue(valuePart))
	}

	return Array.from(parsed, ([name, value]) => ({ name, value }))
}

async function resolveGithubRepo(
	repoRoot: string,
	explicitRepo?: string,
): Promise<string> {
	if (explicitRepo) {
		return explicitRepo
	}

	const result = await $({
		cwd: repoRoot,
		stdio: 'pipe',
	})`gh repo view --json nameWithOwner --jq .nameWithOwner`

	const repo = result.stdout.trim()
	if (!repo) {
		throw new Error(
			'Could not determine GitHub repository. Pass --repo owner/name.',
		)
	}

	return repo
}

async function setGithubActionSecret(input: {
	repo: string
	name: string
	value: string
	cwd: string
}): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const child = spawn(
			'gh',
			['secret', 'set', input.name, '--repo', input.repo],
			{
				cwd: input.cwd,
				stdio: ['pipe', 'pipe', 'pipe'],
			},
		)

		let stderr = ''
		child.stderr.on('data', (chunk) => {
			stderr += chunk.toString()
		})

		child.on('error', reject)
		child.on('close', (code) => {
			if (code === 0) {
				resolve()
				return
			}

			reject(
				new Error(stderr.trim() || `gh secret set failed for '${input.name}'.`),
			)
		})

		child.stdin.write(input.value)
		child.stdin.end()
	})
}

function parseArgs(args: string[]): {
	envFile: string
	repo: string | undefined
	dryRun: boolean
} {
	let envFile = '.env.local'
	let repo: string | undefined
	let dryRun = false

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index]

		if (arg === '--dry-run') {
			dryRun = true
			continue
		}

		if (arg === '--env-file') {
			const value = args[index + 1]
			if (!value) {
				throw new Error('Missing value for --env-file')
			}
			envFile = value
			index += 1
			continue
		}

		if (arg === '--repo') {
			const value = args[index + 1]
			if (!value) {
				throw new Error('Missing value for --repo')
			}
			repo = value
			index += 1
			continue
		}

		throw new Error(
			`Unknown argument '${arg}'. Usage: aamini update-action-secrets [--env-file path] [--repo owner/name] [--dry-run]`,
		)
	}

	return { envFile, repo, dryRun }
}

async function updateActionSecrets(
	repoRoot: string,
	args: string[],
	{
		resolveRepo = resolveGithubRepo,
		setSecret = setGithubActionSecret,
	}: UpdateActionSecretsOptions = {},
): Promise<void> {
	const parsedArgs = parseArgs(args)
	const envPath = path.resolve(repoRoot, parsedArgs.envFile)

	if (!fs.existsSync(envPath)) {
		throw new Error(`Env file not found: ${envPath}`)
	}

	const fileContents = fs.readFileSync(envPath, 'utf8')
	const secrets = parseEnvLocal(fileContents)

	if (secrets.length === 0) {
		throw new Error(`No valid secrets found in ${envPath}`)
	}

	const repo = await resolveRepo(repoRoot, parsedArgs.repo)

	if (parsedArgs.dryRun) {
		for (const secret of secrets) {
			console.log(`Would update ${secret.name} in ${repo}`)
		}
		console.log(`Dry run complete. ${secrets.length} secrets found.`)
		return
	}

	for (const secret of secrets) {
		console.log(`Updating ${secret.name}...`)
		await setSecret({
			cwd: repoRoot,
			repo,
			name: secret.name,
			value: secret.value,
		})
	}

	console.log(`Updated ${secrets.length} GitHub Actions secrets in ${repo}.`)
}

export { parseEnvLocal, updateActionSecrets }
