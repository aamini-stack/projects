import * as fs from 'node:fs'
import * as path from 'node:path'
import { Command } from 'commander'
import { githubRequest } from '../helpers/github.ts'
import { getRepoRoot } from '../helpers/repo.ts'

export function createEnvCommand(): Command {
	const cli = new Command('env')
	cli.description(
		'Sync local env files to GitHub Actions variables and secrets',
	)

	cli
		.command('sync')
		.description(
			'Upload .env as Actions variables and .env.local as Actions secrets',
		)
		.action(async () => {
			const repoRoot = await getRepoRoot()
			const repo = await getRepoRef(repoRoot)

			const envFile = path.join(repoRoot, '.env')
			const envLocalFile = path.join(repoRoot, '.env.local')

			if (fs.existsSync(envFile)) {
				const vars = parseEnvFile(envFile)
				if (vars.size === 0) {
					console.log('.env is empty, skipping variables.')
				} else {
					await syncVariables(repo, vars)
				}
			} else {
				console.log('No .env found, skipping variables.')
			}

			if (fs.existsSync(envLocalFile)) {
				const secrets = parseEnvFile(envLocalFile)
				if (secrets.size === 0) {
					console.log('.env.local is empty, skipping secrets.')
				} else {
					await syncSecrets(repo, secrets)
				}
			} else {
				console.log('No .env.local found, skipping secrets.')
			}

			console.log('Done.')
		})

	cli.action(() => {
		cli.outputHelp()
	})

	return cli
}

type RepoRef = { name: string; owner: string }

async function getRepoRef(repoRoot: string): Promise<RepoRef> {
	const { $ } = await import('zx')
	const result = await $({
		cwd: repoRoot,
		nothrow: true,
		stdio: 'pipe',
	})`git remote get-url origin`
	if (result.exitCode !== 0) {
		throw new Error('Could not determine git remote.')
	}
	const url = result.stdout.trim()
	const match = url.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/)
	if (!match) {
		throw new Error(`Could not parse repo from remote URL: ${url}`)
	}
	return { owner: match[1]!, name: match[2]! }
}

function parseEnvFile(filePath: string): Map<string, string> {
	const content = fs.readFileSync(filePath, 'utf8')
	const entries = new Map<string, string>()

	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) continue

		const eqIndex = trimmed.indexOf('=')
		if (eqIndex === -1) continue

		const key = trimmed.slice(0, eqIndex).trim()
		const value = trimmed.slice(eqIndex + 1).trim()
		if (key) entries.set(key, value)
	}

	return entries
}

async function syncVariables(
	repo: RepoRef,
	vars: Map<string, string>,
): Promise<void> {
	console.log(
		`Syncing ${vars.size} variable(s) to ${repo.owner}/${repo.name}...`,
	)

	for (const [key, value] of vars) {
		await githubRequest({
			method: 'POST',
			path: `/repos/${repo.owner}/${repo.name}/actions/variables`,
			body: { name: key, value },
		})
		console.log(`  var: ${key}`)
	}
}

async function syncSecrets(
	repo: RepoRef,
	secrets: Map<string, string>,
): Promise<void> {
	console.log(
		`Syncing ${secrets.size} secret(s) to ${repo.owner}/${repo.name}...`,
	)

	const publicKey = await githubRequest<{ key: string; key_id: string }>({
		path: `/repos/${repo.owner}/${repo.name}/actions/secrets/public-key`,
	})

	const sodium = await import('libsodium-wrappers')
	await sodium.ready

	for (const [key, value] of secrets) {
		const binKey = sodium.from_base64(
			publicKey.key,
			sodium.base64_variants.ORIGINAL,
		)
		const encrypted = sodium.crypto_box_seal(value, binKey)
		const encryptedValue = sodium.to_base64(
			encrypted,
			sodium.base64_variants.ORIGINAL,
		)

		await githubRequest({
			method: 'PUT',
			path: `/repos/${repo.owner}/${repo.name}/actions/secrets/${key}`,
			body: { encrypted_value: encryptedValue, key_id: publicKey.key_id },
		})
		console.log(`  secret: ${key}`)
	}
}
