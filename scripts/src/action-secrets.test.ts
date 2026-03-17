import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { parseEnvLocal, updateActionSecrets } from './action-secrets.ts'

function makeRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), 'aamini-actions-secrets-'))
}

describe('parseEnvLocal', () => {
	it('parses valid secret assignments from env content', () => {
		const secrets = parseEnvLocal(`
# comment
PLAIN=value
QUOTED="hello world"
export TOKEN='abc123'
INVALID-LINE
`)

		expect(secrets).toEqual([
			{ name: 'PLAIN', value: 'value' },
			{ name: 'QUOTED', value: 'hello world' },
			{ name: 'TOKEN', value: 'abc123' },
		])
	})
})

describe('updateActionSecrets', () => {
	it('syncs every parsed key to GitHub secrets', async () => {
		const repoRoot = makeRepo()
		fs.writeFileSync(
			path.join(repoRoot, '.env.local'),
			'FIRST=one\nSECOND="two"\n',
		)

		const setSecret = vi.fn().mockResolvedValue(undefined)
		const resolveRepo = vi.fn().mockResolvedValue('aamini/repo')

		await updateActionSecrets(repoRoot, [], { setSecret, resolveRepo })

		expect(resolveRepo).toHaveBeenCalledWith(repoRoot, undefined)
		expect(setSecret).toHaveBeenCalledTimes(2)
		expect(setSecret).toHaveBeenNthCalledWith(1, {
			cwd: repoRoot,
			repo: 'aamini/repo',
			name: 'FIRST',
			value: 'one',
		})
		expect(setSecret).toHaveBeenNthCalledWith(2, {
			cwd: repoRoot,
			repo: 'aamini/repo',
			name: 'SECOND',
			value: 'two',
		})
	})
})
