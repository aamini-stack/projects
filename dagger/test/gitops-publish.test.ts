import { describe, expect, it } from 'vitest'
import {
	buildGitopsPublishPlan,
	buildGitopsPushArgs,
	resolveGitopsSourceMetadata,
} from '../src/gitops/publish.ts'

describe('buildGitopsPublishPlan', () => {
	it('builds one OCI reference per requested tag with source metadata', () => {
		expect(
			buildGitopsPublishPlan({
				registry: 'ghcr.io/aamini-stack/projects-gitops',
				tags: ['pr-42', 'abc123'],
				sourcePath: '/manifests',
				source: 'git@github.com:aamini-stack/projects.git',
				revision: 'main@sha1:deadbeef',
			}),
		).toEqual({
			references: [
				'oci://ghcr.io/aamini-stack/projects-gitops:pr-42',
				'oci://ghcr.io/aamini-stack/projects-gitops:abc123',
			],
			sourcePath: '/manifests',
			source: 'git@github.com:aamini-stack/projects.git',
			revision: 'main@sha1:deadbeef',
		})
	})

	it('throws when registry is empty', () => {
		expect(() =>
			buildGitopsPublishPlan({
				registry: '',
				tags: ['latest'],
				sourcePath: '/manifests',
			}),
		).toThrow('registry is required to publish gitops state')
	})

	it('prefers GitHub environment metadata when available', () => {
		expect(
			resolveGitopsSourceMetadata({
				tags: ['latest', 'main-deadbeef'],
				githubServerUrl: 'https://github.com',
				githubRepository: 'aamini-stack/projects',
				githubRefName: 'main',
				githubSha: 'deadbeef',
			}),
		).toEqual({
			source: 'https://github.com/aamini-stack/projects.git',
			revision: 'main@sha1:deadbeef',
		})
	})

	it('falls back to the main tag sha for local publishes', () => {
		expect(
			resolveGitopsSourceMetadata({
				tags: ['latest', 'main-deadbeef'],
			}),
		).toEqual({
			source: 'git@github.com:aamini-stack/projects.git',
			revision: 'main@sha1:deadbeef',
		})
	})

	it('builds flux push args with explicit registry credentials', () => {
		expect(
			buildGitopsPushArgs({
				reference: 'oci://ghcr.io/aamini-stack/projects-gitops:latest',
				sourcePath: '/tmp/manifests',
				source: 'git@github.com:aamini-stack/projects.git',
				revision: 'main@sha1:deadbeef',
				creds: 'aamini:$GITHUB_TOKEN',
			}),
		).toEqual([
			'push',
			'artifact',
			'oci://ghcr.io/aamini-stack/projects-gitops:latest',
			'--path=/tmp/manifests',
			'--source=git@github.com:aamini-stack/projects.git',
			'--revision=main@sha1:deadbeef',
			'--creds=aamini:$GITHUB_TOKEN',
		])
	})
})
