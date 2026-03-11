import { describe, expect, it } from 'vitest'

import {
	buildGitopsBundleFiles,
	type AppDefinition,
} from '../src/gitops/render.ts'
import { buildGitopsPublishPlan } from '../src/gitops/publish.ts'

describe('buildGitopsPublishPlan render integration', () => {
	it('publishes the rendered output directory', () => {
		expect(
			buildGitopsPublishPlan({
				registry: 'ghcr.io/aamini-stack/projects-gitops',
				tags: ['latest'],
				sourcePath: '/tmp/gitops-rendered',
				source: 'git@github.com:aamini-stack/projects.git',
				revision: 'main@sha1:deadbeef',
			}),
		).toEqual({
			references: ['oci://ghcr.io/aamini-stack/projects-gitops:latest'],
			sourcePath: '/tmp/gitops-rendered',
			source: 'git@github.com:aamini-stack/projects.git',
			revision: 'main@sha1:deadbeef',
		})
	})
})

describe('buildGitopsBundleFiles', () => {
	it('includes app-scoped sealed secrets in the rendered applications bundle', () => {
		const apps: AppDefinition[] = [
			{
				name: 'portfolio',
				namespace: 'portfolio',
				image: {
					repository: 'ghcr.io/aamini-stack/portfolio',
					policy: 'portfolio',
				},
				stable: {
					host: 'portfolio.ariaamini.com',
					envFromSecret: 'portfolio-secrets',
				},
				preview: {
					enabled: true,
				},
			},
		]

		const files = buildGitopsBundleFiles({
			controllers: 'kind: Namespace\nmetadata:\n  name: platform-controllers\n',
			networking: 'kind: Namespace\nmetadata:\n  name: flux-system\n',
			previews: 'kind: Namespace\nmetadata:\n  name: app-preview\n',
			apps,
			appManifests: [
				[
					'apiVersion: bitnami.com/v1alpha1',
					'kind: SealedSecret',
					'metadata:',
					'  name: secrets',
					'  namespace: portfolio',
					'spec:',
					'  encryptedData:',
					'    TOKEN: encrypted',
					'  template:',
					'    metadata:',
					'      name: portfolio-secrets',
					'      namespace: portfolio',
				].join('\n'),
			],
		})

		expect(files['apps/applications.yaml']).toMatch(
			/kind: SealedSecret[\s\S]*name: portfolio-secrets/,
		)
	})
})
