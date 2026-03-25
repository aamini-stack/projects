import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { execPassthrough } from '../lib/process/exec.ts'

type Environment = 'staging' | 'production'

function parseEnvironment(value: string | undefined): Environment {
	if (value === 'staging' || value === 'production') {
		return value
	}

	throw new Error('Pass --environment with one of: staging, production')
}

function main(): void {
	const { values } = parseArgs({
		args: process.argv.slice(2).filter((arg) => arg !== '--'),
		options: {
			environment: { type: 'string' },
			profile: { type: 'string' },
			org: { type: 'string' },
			region: { type: 'string' },
			'non-interactive': { type: 'boolean', default: false },
			'remove-stacks': { type: 'boolean', default: false },
		},
	})

	const environment = parseEnvironment(values.environment)
	const profile = values.profile ?? process.env.AWS_PROFILE
	if (!profile) {
		throw new Error('Missing --profile (or AWS_PROFILE).')
	}

	const currentFilePath = fileURLToPath(import.meta.url)
	const infraDir = resolve(dirname(currentFilePath), '..', '..')
	const platformDir = resolve(infraDir, 'src/programs/platform')
	const org = values.org ?? process.env.PULUMI_ORG

	if (org) {
		console.log(`Cancelling in-flight update for ${org}/${environment}...`)
		execPassthrough({
			cmd: 'pulumi',
			args: ['cancel', '--yes', '--stack', `${org}/${environment}`],
			cwd: platformDir,
			env: process.env,
		})
	} else {
		console.log('PULUMI_ORG/--org not set, skipping pulumi cancel pre-step.')
	}

	const bootstrapArgs = [
		'bootstrap',
		'--',
		'destroy',
		'--project',
		'platform',
		'--environment',
		environment,
		'--profile',
		profile,
	]

	if (values.org) {
		bootstrapArgs.push('--org', values.org)
	}

	if (values.region) {
		bootstrapArgs.push('--region', values.region)
	}

	if (values['non-interactive']) {
		bootstrapArgs.push('--non-interactive')
	}

	if (values['remove-stacks']) {
		bootstrapArgs.push('--remove-stacks')
	}

	console.log(`Running targeted platform destroy for ${environment}...`)
	execPassthrough({
		cmd: 'pnpm',
		args: bootstrapArgs,
		cwd: infraDir,
		env: process.env,
	})
}

try {
	main()
} catch (error: unknown) {
	const message = error instanceof Error ? error.message : String(error)
	console.error(`Platform recovery failed: ${message}`)
	process.exit(1)
}
