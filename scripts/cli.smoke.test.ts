import { test, expect } from 'vitest'
import { execSync } from 'node:child_process'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const scriptsDir = path.resolve(scriptDir)
const aaminiPath = path.join(scriptsDir, 'bin', 'aamini')

function runCommand(args: string[]): string {
	try {
		return execSync(`bash ${aaminiPath} ${args.join(' ')}`, {
			cwd: scriptsDir,
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
		})
	} catch (error) {
		const err = error as { stdout?: string; stderr?: string }
		return err.stdout || err.stderr || ''
	}
}

test('aamini', () => {
	const aaminiHelp = runCommand([])
	expect(aaminiHelp).toMatchInlineSnapshot(`
		"Usage: aamini [options] [command]

		@aamini-stack CLI tool

		Options:
		  -V, --version   output the version number
		  -h, --help      display help for command

		Commands:
		  e2e             Run e2e tests
		  secrets         Manage secrets
		  docker          Docker utilities
		  ci              CI utilities
		  pm [options]    Project management
		  help [command]  display help for command
		"
	`)
	expect(runCommand(['--help'])).toEqual(aaminiHelp)
})

test('aamini e2e', () => {
	const e2eHelp = runCommand(['e2e'])
	expect(e2eHelp).toMatchInlineSnapshot(`
		"Usage: aamini e2e [options] [command]

		Run e2e tests

		Options:
		  -h, --help           display help for command

		Commands:
		  run [options] [app]  Run e2e for a specific app or all apps
		  help [command]       display help for command
		"
	`)
	expect(runCommand(['e2e', '--help'])).toEqual(e2eHelp)
})

test('aamini secrets', () => {
	const secretsHelp = runCommand(['secrets'])
	expect(secretsHelp).toMatchInlineSnapshot(`
		"Usage: aamini secrets [options] [command]

		Manage secrets

		Options:
		  -h, --help  display help for command

		Commands:
		  seal        Seal all app secrets
		  unseal      Unseal all app secrets
		  update      Update all sealed secrets
		"
	`)
	expect(runCommand(['secrets', '--help'])).toEqual(secretsHelp)
})

test('aamini docker', () => {
	const dockerHelp = runCommand(['docker'])
	expect(dockerHelp).toMatchInlineSnapshot(`
		"Usage: aamini docker [options] [command]

		Docker utilities

		Options:
		  -h, --help             display help for command

		Commands:
		  build [options] [app]  Build Docker image for a specific app
		  push [options] [app]   Push Docker image for a specific app
		  deploy [options]       Deploy Docker container
		"
	`)
	expect(runCommand(['docker', '--help'])).toEqual(dockerHelp)
})

test('aamini ci', () => {
	const ciHelp = runCommand(['ci'])
	expect(ciHelp).toMatchInlineSnapshot(`
		"Usage: aamini ci [options] [command]

		CI utilities

		Options:
		  -h, --help      display help for command

		Commands:
		  preview         Preview deployment operations
		  events          Event operations
		  e2e             E2E operations
		  help [command]  display help for command
		"
	`)
	expect(runCommand(['ci', '--help'])).toEqual(ciHelp)
})

test('aamini pm', () => {
	const pmHelp = runCommand(['pm'])
	expect(pmHelp).toMatchInlineSnapshot(`
		"Usage: aamini pm [options] [command]

		Project management

		Options:
		  -V, --version                             output the version number
		  -h, --help                                display help for command

		Commands:
		  next                                      Show next available tasks
		  progress                                  Show task progress
		  wipe                                      Wipe all progress fields
		  show <id>                                 Show details for a task
		  update <id> <field> [value...]            Update task field
		  done [taskOrJson] [commitSha] [notes...]  Mark task done
		  blocked <id> [notes...]                   Mark task blocked
		  ci                                        Run CI checks across all apps
		"
	`)
	expect(runCommand(['pm', '--help'])).toEqual(pmHelp)
})
