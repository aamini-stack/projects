import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(import.meta.dirname, '..', '..')

describe('dagger module config', () => {
	it('keeps runtime sources inside the dagger module boundary', () => {
		const daggerConfig = JSON.parse(
			readFileSync(path.join(repoRoot, 'dagger.json'), 'utf8'),
		) as { include: string[]; source: string }
		const indexSource = readFileSync(
			path.join(repoRoot, 'dagger/src/index.ts'),
			'utf8',
		)

		expect(daggerConfig.source).toBe('dagger')
		expect(daggerConfig.include).toContain('Dockerfile')
		expect(daggerConfig.include).toContain('apps/**')
		expect(daggerConfig.include).toContain('packages/**')
		expect(daggerConfig.include).not.toContain('.npmrc')
		expect(indexSource).not.toContain("from '../dagger/src/gitops/render.ts'")
		expect(indexSource).toContain("from './gitops/render.ts'")
		expect(indexSource).toContain('export class PreviewPipeline')
		expect(indexSource).toContain('dag.currentEnv().workspace()')
		expect(indexSource).not.toContain(
			'dag.currentModule().generatedContextDirectory()',
		)
	})

	it('uses the env workspace for docker builds and env-driven flux source metadata', () => {
		const indexSource = readFileSync(
			path.join(repoRoot, 'dagger/src/index.ts'),
			'utf8',
		)

		expect(indexSource).toContain('dag.currentEnv().workspace()')
		expect(indexSource).toContain(".from('alpine/git:2.49.1')")
		expect(indexSource).toContain(
			".withMountedDirectory('/repo', dag.currentEnv().workspace())",
		)
		expect(indexSource).toContain(
			".withExec(['git', 'diff', '--name-only', baseRef, headRef])",
		)
		expect(indexSource).toContain('.dockerBuild({')
		expect(indexSource).toContain("platform: 'linux/amd64'")
		expect(indexSource).toContain('buildGitopsBundleFiles(')
		expect(indexSource).toContain('dag.directory()')
		expect(indexSource).toContain("sourcePath: '/tmp/manifests'")
		expect(indexSource).toContain(
			".withDirectory('/tmp/manifests', renderedDirectory)",
		)
		expect(indexSource).toContain(".withWorkdir('/tmp')")
		expect(indexSource).toContain(".withUser('root')")
		expect(indexSource).not.toContain('dag.host().directory(')
		expect(indexSource).toContain('resolveGitopsSourceMetadata({')
		expect(indexSource).not.toContain("execFileSync('git'")
		expect(indexSource).toContain(
			"withSecretVariable('HELM_REGISTRY_PASSWORD', githubToken)",
		)
		expect(indexSource).toContain(
			'.withMountedDirectory(plan.mountPath, context.directory(plan.chartPath))',
		)
		expect(indexSource).toContain('plan.loginArgs')
		expect(indexSource).toContain('buildGitopsPushArgs({')
		expect(indexSource).toContain(
			"withSecretVariable('GITHUB_TOKEN', githubToken)",
		)
		expect(indexSource).toContain('.withoutEntrypoint()')
		expect(indexSource).toContain('creds: `${githubActor}:$GITHUB_TOKEN`')
		expect(indexSource).toContain("withExec(['sh', '-c'")
	})
})
