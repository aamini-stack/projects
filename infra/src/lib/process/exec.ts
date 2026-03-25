import { execFileSync } from 'node:child_process'

type ExecOptions = {
	cmd: string
	args: string[]
	cwd?: string
	env?: NodeJS.ProcessEnv
	stdio?: 'inherit' | ['ignore', 'pipe', 'pipe']
	encoding?: BufferEncoding
}

export function execText(options: ExecOptions): string {
	return execFileSync(options.cmd, options.args, {
		cwd: options.cwd,
		encoding: options.encoding ?? 'utf8',
		env: options.env,
		stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
	})
}

export function execJson<T>(options: ExecOptions): T {
	return JSON.parse(execText(options)) as T
}

export function execPassthrough(options: Omit<ExecOptions, 'stdio'>): void {
	execFileSync(options.cmd, options.args, {
		cwd: options.cwd,
		encoding: options.encoding ?? 'utf8',
		env: options.env,
		stdio: 'inherit',
	})
}

export function commandExists(
	cmd: string,
	args: string[] = ['--version'],
): boolean {
	try {
		execText({ cmd, args })
		return true
	} catch {
		return false
	}
}
