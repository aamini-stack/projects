import { parseArgs } from 'node:util'

import type {
	BootstrapOptions,
	Command,
	EnvironmentTarget,
	ProjectTarget,
} from './types.ts'

function parseCommand(value: string | undefined): Command {
	if (!value || value === 'up') {
		return 'up'
	}

	if (value === 'destroy') {
		return 'destroy'
	}

	throw new Error("Invalid command. Expected 'up' or 'destroy'.")
}

function parseProjectTarget(value: string): ProjectTarget {
	if (value === 'all' || value === 'organization' || value === 'platform') {
		return value
	}

	throw new Error(
		`Invalid --project '${value}'. Expected one of: all, organization, platform.`,
	)
}

function parseEnvironmentTarget(value: string): EnvironmentTarget {
	if (
		value === 'all' ||
		value === 'global' ||
		value === 'staging' ||
		value === 'production'
	) {
		return value
	}

	throw new Error(
		`Invalid --environment '${value}'. Expected one of: all, global, staging, production.`,
	)
}

export function printBootstrapUsage(): void {
	console.log('Usage: pnpm bootstrap -- [up|destroy] [options]')
	console.log('')
	console.log('Examples:')
	console.log('  pnpm bootstrap -- up --profile aamini-root')
	console.log('  pnpm bootstrap -- up --preview')
	console.log('  pnpm bootstrap -- up --check --project organization')
	console.log(
		'  pnpm bootstrap -- destroy --project platform --environment staging --remove-stacks',
	)
	console.log('')
	console.log('Profile resolution order:')
	console.log('  1) --profile')
	console.log('  2) AWS_PROFILE')
	console.log('  3) AWS_DEFAULT_PROFILE')
}

export function parseBootstrapCli(
	argv: string[],
): BootstrapOptions | undefined {
	const cliArgs = argv.slice(2).filter((arg) => arg !== '--')

	const { values, positionals } = parseArgs({
		args: cliArgs,
		allowPositionals: true,
		options: {
			help: { type: 'boolean', default: false },
			check: { type: 'boolean' },
			nonInteractive: { type: 'boolean' },
			org: { type: 'string' },
			profile: { type: 'string' },
			region: { type: 'string' },
			preview: { type: 'boolean', default: false },
			dryRun: { type: 'boolean', default: false },
			project: { type: 'string', default: 'all' },
			environment: { type: 'string', default: 'all' },
			'remove-stacks': { type: 'boolean', default: false },
		},
	})

	if (values.help) {
		printBootstrapUsage()
		return undefined
	}

	const check = values.check ?? false
	const dryRun = (values.dryRun ?? false) || check

	if (parseCommand(positionals[0]) !== 'destroy' && values['remove-stacks']) {
		throw new Error('--remove-stacks is only valid with the destroy command.')
	}

	if (dryRun && values.preview) {
		throw new Error('Dry run cannot be combined with --preview.')
	}

	return {
		command: parseCommand(positionals[0]),
		check,
		nonInteractive: values.nonInteractive ?? false,
		org: values.org,
		profile: values.profile,
		region: values.region,
		preview: values.preview,
		dryRun,
		projectTarget: parseProjectTarget(values.project),
		environmentTarget: parseEnvironmentTarget(values.environment),
		removeStacks: values['remove-stacks'],
	}
}
