import { randomBytes } from 'node:crypto'
import { access, readFile, writeFile } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

import * as automation from '@pulumi/pulumi/automation'

const projectDir = process.cwd()
const workspaceRoot = join(projectDir, '..', '..')
const stackName = 'staging'
const subscriptionId =
	process.env.SUBSCRIPTION_ID ?? '331269d5-143f-4246-b389-9c1f41bb5882'
const servicePrincipalName =
	process.env.SERVICE_PRINCIPAL_NAME ?? 'aamini-platform-staging'
const envFileName = process.env.ENV_FILE ?? '.env.staging.local'
const envFilePath = join(projectDir, envFileName)
const miseFileName = process.env.MISE_FILE ?? '.mise.local.toml'
const miseFilePath = join(workspaceRoot, miseFileName)
const subscriptionScope = `/subscriptions/${subscriptionId}`

type ServicePrincipal = {
	appId: string
	id: string
}

type EnvValues = Record<string, string>

function run(command: string, args: string[], options?: { input?: string }) {
	const result = spawnSync(command, args, {
		cwd: projectDir,
		encoding: 'utf8',
		input: options?.input,
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

function runJson<T>(command: string, args: string[]) {
	const stdout = run(command, args)
	return JSON.parse(stdout) as T
}

async function ensureFileExists(filePath: string) {
	await access(filePath, fsConstants.F_OK)
}

async function readOptionalFile(filePath: string) {
	try {
		return await readFile(filePath, 'utf8')
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return null
		}

		throw error
	}
}

function parseEnvFile(contents: string | null): EnvValues {
	if (!contents) {
		return {}
	}

	return Object.fromEntries(
		contents
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith('#'))
			.map((line) => {
				const separatorIndex = line.indexOf('=')
				if (separatorIndex === -1) {
					return [line, '']
				}

				return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)]
			}),
	)
}

function parseMiseEnvFile(contents: string | null): EnvValues {
	if (!contents) {
		return {}
	}

	return Object.fromEntries(
		contents
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => /^[A-Z0-9_]+\s*=/.test(line))
			.map((line) => {
				const separatorIndex = line.indexOf('=')
				const key = line.slice(0, separatorIndex).trim()
				const rawValue = line.slice(separatorIndex + 1).trim()
				return [key, JSON.parse(rawValue) as string]
			}),
	)
}

async function prompt(question: string, defaultValue?: string) {
	const rl = createInterface({ input, output })
	const suffix = defaultValue ? ` [${defaultValue}]` : ''
	const answer = (await rl.question(`${question}${suffix}: `)).trim()
	rl.close()
	return answer || defaultValue || ''
}

function envBoolean(name: string, fallback: boolean) {
	const value = process.env[name]
	if (!value) return fallback
	return ['1', 'true', 'yes', 'y'].includes(value.toLowerCase())
}

function generatePassword(length = 24) {
	return randomBytes(length).toString('base64url').slice(0, length)
}

function toTomlString(value: string) {
	return JSON.stringify(value)
}

function ensureRoleAssignment(
	scope: string,
	role: string,
	principalId: string,
) {
	const count = run('az', [
		'role',
		'assignment',
		'list',
		'--assignee-object-id',
		principalId,
		'--scope',
		scope,
		'--query',
		`[?roleDefinitionName=='${role}'] | length(@)`,
		'-o',
		'tsv',
	])

	if (count !== '0') {
		return
	}

	run('az', [
		'role',
		'assignment',
		'create',
		'--assignee-object-id',
		principalId,
		'--assignee-principal-type',
		'ServicePrincipal',
		'--role',
		role,
		'--scope',
		scope,
	])
}

function resolveServicePrincipal(): ServicePrincipal {
	const matches = runJson<ServicePrincipal[]>('az', [
		'ad',
		'sp',
		'list',
		'--display-name',
		servicePrincipalName,
		'-o',
		'json',
	])

	const existing = matches[0]
	if (existing?.id && existing?.appId) {
		return existing
	}

	const appId = run('az', [
		'ad',
		'sp',
		'create-for-rbac',
		'--name',
		servicePrincipalName,
		'--create-password',
		'false',
		'--query',
		'appId',
		'-o',
		'tsv',
	])
	const id = run('az', [
		'ad',
		'sp',
		'show',
		'--id',
		appId,
		'--query',
		'id',
		'-o',
		'tsv',
	])

	return { appId, id }
}

async function main() {
	await ensureFileExists(join(projectDir, 'Pulumi.yaml'))
	const existingEnv = parseEnvFile(await readOptionalFile(envFilePath))
	const existingMise = parseMiseEnvFile(await readOptionalFile(miseFilePath))

	const tenantId = run('az', [
		'account',
		'show',
		'--query',
		'tenantId',
		'-o',
		'tsv',
	])
	run('az', ['account', 'set', '--subscription', subscriptionId])

	const servicePrincipal = resolveServicePrincipal()
	ensureRoleAssignment(subscriptionScope, 'Contributor', servicePrincipal.id)
	ensureRoleAssignment(
		subscriptionScope,
		'User Access Administrator',
		servicePrincipal.id,
	)
	ensureRoleAssignment(
		subscriptionScope,
		'Azure Kubernetes Service Cluster User Role',
		servicePrincipal.id,
	)

	const currentClientSecret =
		process.env.AZURE_CLIENT_SECRET ??
		existingEnv.AZURE_CLIENT_SECRET ??
		existingMise.AZURE_CLIENT_SECRET
	const shouldResetSpSecret = envBoolean(
		'RESET_SP_SECRET',
		!currentClientSecret,
	)
	const clientSecret = shouldResetSpSecret
		? run('az', [
				'ad',
				'sp',
				'credential',
				'reset',
				'--id',
				servicePrincipal.appId,
				'--append',
				'--display-name',
				'bootstrap-staging',
				'--years',
				'1',
				'--query',
				'password',
				'-o',
				'tsv',
			])
		: currentClientSecret || (await prompt('Existing service principal secret'))

	const stack = await automation.LocalWorkspace.selectStack({
		stackName,
		workDir: projectDir,
	})

	const githubConfig = await stack.getConfig('aamini-platform:githubApiToken')
	const dbPasswordConfig = await stack.getConfig('aamini-platform:dbPassword')

	const githubApiToken =
		process.env.GITHUB_API_TOKEN ||
		(githubConfig?.value ? null : await prompt('GitHub API token'))
	const dbPassword =
		process.env.DB_PASSWORD ||
		(dbPasswordConfig?.value
			? null
			: await prompt('Database password', generatePassword()))

	if (githubApiToken) {
		await stack.setConfig('aamini-platform:githubApiToken', {
			value: githubApiToken,
			secret: true,
		})
	}
	if (dbPassword) {
		await stack.setConfig('aamini-platform:dbPassword', {
			value: dbPassword,
			secret: true,
		})
	}

	const envFile = [
		`AZURE_CLIENT_ID=${servicePrincipal.appId}`,
		`AZURE_CLIENT_SECRET=${clientSecret}`,
		`AZURE_SUBSCRIPTION_ID=${subscriptionId}`,
		`AZURE_TENANT_ID=${tenantId}`,
		`PULUMI_STACK=${stackName}`,
	].join('\n')
	const miseFile = [
		'[env]',
		`AZURE_CLIENT_ID = ${toTomlString(servicePrincipal.appId)}`,
		`AZURE_CLIENT_SECRET = ${toTomlString(clientSecret)}`,
		`AZURE_SUBSCRIPTION_ID = ${toTomlString(subscriptionId)}`,
		`AZURE_TENANT_ID = ${toTomlString(tenantId)}`,
		`PULUMI_STACK = ${toTomlString(stackName)}`,
	].join('\n')

	await writeFile(envFilePath, `${envFile}\n`, 'utf8')
	await writeFile(miseFilePath, `${miseFile}\n`, 'utf8')

	output.write(`\nWrote ${envFileName}\n`)
	output.write(`Wrote ${miseFileName}\n`)
	output.write('Updated Pulumi secret config for staging\n')
	output.write('\nNext steps:\n')
	output.write(`1. mise trust ${miseFilePath}\n`)
	output.write('2. re-enter the repo, or run `mise env` in your shell\n')
	output.write('3. pulumi up\n')
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error)
	console.error(message)
	process.exitCode = 1
})
