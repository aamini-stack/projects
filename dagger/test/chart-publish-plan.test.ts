import { describe, expect, it } from 'vitest'
import { buildChartPublishPlan } from '../src/chart/publish.ts'

describe('buildChartPublishPlan', () => {
	it('builds the app release chart publish contract Flux depends on', () => {
		expect(
			buildChartPublishPlan({
				chartPath: 'packages/infra/charts/app-release',
				registry: 'oci://ghcr.io/aamini-stack/app-release',
				version: '0.1.0',
				githubActor: 'aamini',
			}),
		).toEqual({
			chartArchive: '/tmp/app-release-0.1.0.tgz',
			chartPath: 'packages/infra/charts/app-release',
			loginArgs: [
				'registry',
				'login',
				'ghcr.io',
				'--username',
				'aamini',
				'--password',
				'$HELM_REGISTRY_PASSWORD',
			],
			mountPath: '/chart',
			packageArgs: [
				'package',
				'/chart',
				'--destination',
				'/tmp',
				'--version',
				'0.1.0',
			],
			pushRef: 'oci://ghcr.io/aamini-stack/app-release',
			pushArgs: [
				'push',
				'/tmp/app-release-0.1.0.tgz',
				'oci://ghcr.io/aamini-stack/app-release',
			],
			registryHost: 'ghcr.io',
			verifyArgs: [
				'show',
				'chart',
				'oci://ghcr.io/aamini-stack/app-release',
				'--version',
				'0.1.0',
			],
		})
	})
})
