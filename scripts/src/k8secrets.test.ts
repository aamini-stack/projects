import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
	findSealTargets,
	normalizeSealedSecretYaml,
	parseTemplateMetadata,
	sealAll,
} from './k8secrets.ts'

function makeRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), 'aamini-k8s-'))
}

function writeFile(filePath: string, contents: string): void {
	fs.mkdirSync(path.dirname(filePath), { recursive: true })
	fs.writeFileSync(filePath, contents)
}

afterEach(() => {
	vi.restoreAllMocks()
})

describe('findSealTargets', () => {
	it('returns only apps with .env.local files', () => {
		const repoRoot = makeRepo()
		writeFile(path.join(repoRoot, 'apps', 'portfolio', '.env.local'), 'A=1\n')
		fs.mkdirSync(path.join(repoRoot, 'apps', 'empty'), { recursive: true })

		expect(findSealTargets(repoRoot)).toEqual([
			{
				app: 'portfolio',
				appDir: path.join(repoRoot, 'apps', 'portfolio'),
				envFile: path.join(repoRoot, 'apps', 'portfolio', '.env.local'),
				output: path.join(
					repoRoot,
					'apps',
					'portfolio',
					'k8s',
					'sealed-secret.yaml',
				),
			},
		])
	})
})

describe('normalizeSealedSecretYaml', () => {
	it('returns the payload unchanged', () => {
		const yaml = `apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: portfolio-secrets
  namespace: portfolio
spec:
  template:
    metadata:
      name: portfolio-secrets
      namespace: portfolio
`

		expect(normalizeSealedSecretYaml(yaml, 'portfolio')).toBe(yaml)
	})
})

describe('parseTemplateMetadata', () => {
	it('reads secret name and namespace from spec.template.metadata', () => {
		const repoRoot = makeRepo()
		const sealedSecretPath = path.join(
			repoRoot,
			'apps',
			'portfolio',
			'k8s',
			'sealed-secret.yaml',
		)
		writeFile(
			sealedSecretPath,
			`apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: portfolio-secrets
  namespace: portfolio
spec:
  template:
    metadata:
      name: portfolio-template-secrets
      namespace: portfolio-template
`,
		)

		expect(parseTemplateMetadata(sealedSecretPath)).toEqual({
			name: 'portfolio-template-secrets',
			namespace: 'portfolio-template',
		})
	})

	it('returns empty strings when template metadata is missing', () => {
		const repoRoot = makeRepo()
		const sealedSecretPath = path.join(
			repoRoot,
			'apps',
			'portfolio',
			'k8s',
			'sealed-secret.yaml',
		)
		writeFile(
			sealedSecretPath,
			`apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: portfolio-secrets
`,
		)

		expect(parseTemplateMetadata(sealedSecretPath)).toEqual({
			name: '',
			namespace: '',
		})
	})
})

describe('sealAll', () => {
	it('writes a sealed secret for each app with .env.local', async () => {
		const repoRoot = makeRepo()
		const envFile = path.join(repoRoot, 'apps', 'portfolio', '.env.local')
		writeFile(envFile, 'MAILGUN_API_KEY=test\n')

		const runCommand = vi
			.fn()
			.mockResolvedValueOnce({
				stdout: 'CERT',
			})
			.mockResolvedValueOnce({
				stdout:
					'apiVersion: v1\nkind: Secret\nmetadata:\n  name: portfolio-secrets\n',
			})
			.mockResolvedValueOnce({
				stdout: `apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: portfolio-secrets
  namespace: portfolio
spec:
  template:
    metadata:
      name: portfolio-secrets
      namespace: portfolio
`,
			})

		await sealAll(repoRoot, { runCommand })

		const output = fs.readFileSync(
			path.join(repoRoot, 'apps', 'portfolio', 'k8s', 'sealed-secret.yaml'),
			'utf8',
		)

		expect(runCommand).toHaveBeenCalledTimes(3)
		const fetchCertCommand = runCommand.mock.calls[0]?.[0]?.command
		expect(fetchCertCommand).toEqual([
			'kubeseal',
			'--fetch-cert',
			'--controller-name=sealed-secrets',
			'--controller-namespace=kube-system',
		])
		const sealCommand = runCommand.mock.calls[2]?.[0]?.command
		expect(sealCommand?.at(0)).toBe('kubeseal')
		expect(sealCommand?.slice(1)).toContain('--format=yaml')
		expect(
			sealCommand?.some(
				(arg: string | undefined) =>
					typeof arg === 'string' && arg.startsWith('--cert='),
			),
		).toBe(true)
		expect(output).toContain('metadata:\n  name: portfolio-secrets')
		expect(output).toContain('  namespace: portfolio')
	})

	it('throws an app-specific error when sealing fails', async () => {
		const repoRoot = makeRepo()
		writeFile(path.join(repoRoot, 'apps', 'portfolio', '.env.local'), 'A=1\n')
		const runCommand = vi
			.fn()
			.mockRejectedValueOnce(new Error('kubectl: command not found'))

		await expect(sealAll(repoRoot, { runCommand })).rejects.toThrow(
			/Failed to fetch sealing cert:/,
		)
	})

	it('throws an app-specific error when sealing to kubeseal fails', async () => {
		const repoRoot = makeRepo()
		writeFile(path.join(repoRoot, 'apps', 'portfolio', '.env.local'), 'A=1\n')
		const runCommand = vi
			.fn()
			.mockResolvedValueOnce({ stdout: 'CERT' })
			.mockResolvedValueOnce({
				stdout:
					'apiVersion: v1\nkind: Secret\nmetadata:\n  name: portfolio-secrets\n',
			})
			.mockRejectedValueOnce(new Error('kubeseal: command not found'))

		await expect(sealAll(repoRoot, { runCommand })).rejects.toThrow(
			/Failed to seal portfolio:/,
		)
	})

	it('throws when no apps have .env.local files', async () => {
		const repoRoot = makeRepo()
		fs.mkdirSync(path.join(repoRoot, 'apps', 'portfolio'), { recursive: true })
		fs.mkdirSync(path.join(repoRoot, 'apps', 'dota-visualizer'), {
			recursive: true,
		})

		const runCommand = vi.fn()

		await expect(sealAll(repoRoot, { runCommand })).rejects.toThrow(
			'No .env.local files found in apps/*/.env.local',
		)
	})
})
