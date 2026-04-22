import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export default function globalSetup() {
	execFileSync('pnpm', ['test:fixtures'], {
		cwd: appRoot,
		stdio: 'inherit',
	})
}
