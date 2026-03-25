import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import { workloadProvider } from './provider.ts'

const repositoryNames = ['apps', 'manifests'] as const

const repositories = Object.fromEntries(
	repositoryNames.map((name) => [
		name,
		(() => {
			const repo = new aws.ecr.Repository(
				name,
				{
					name,
					imageTagMutability: 'MUTABLE',
					imageScanningConfiguration: {
						scanOnPush: true,
					},
					encryptionConfigurations: [
						{
							encryptionType: 'AES256',
						},
					],
					forceDelete: true,
				},
				{ provider: workloadProvider },
			)

			new aws.ecr.LifecyclePolicy(
				`${name}-lifecycle`,
				{
					repository: repo.name,
					policy: JSON.stringify({
						rules: [
							{
								rulePriority: 1,
								description: 'Expire untagged images after 14 days',
								selection: {
									tagStatus: 'untagged',
									countType: 'sinceImagePushed',
									countUnit: 'days',
									countNumber: 14,
								},
								action: { type: 'expire' },
							},
							{
								rulePriority: 2,
								description: 'Keep only the last 30 tagged images',
								selection: {
									tagStatus: 'tagged',
									tagPrefixList: ['pr-', 'main-'],
									countType: 'imageCountMoreThan',
									countNumber: 30,
								},
								action: { type: 'expire' },
							},
						],
					}),
				},
				{ provider: workloadProvider },
			)

			return repo
		})(),
	]),
) as Record<(typeof repositoryNames)[number], aws.ecr.Repository>

const repositoryUrls = Object.fromEntries(
	repositoryNames.map((name) => [name, repositories[name].repositoryUrl]),
) as Record<(typeof repositoryNames)[number], pulumi.Output<string>>

const repositoryArns = Object.fromEntries(
	repositoryNames.map((name) => [name, repositories[name].arn]),
) as Record<(typeof repositoryNames)[number], pulumi.Output<string>>

export { repositoryUrls, repositoryArns, repositoryNames }
