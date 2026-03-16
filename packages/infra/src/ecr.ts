import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

const repositoryNames = [
	'imdbgraph',
	'portfolio',
	'pc-tune-ups',
	'dota-visualizer',
	'app-release',
	'projects-gitops',
] as const

const callerIdentity = aws.getCallerIdentityOutput({})
const region = aws.getRegionOutput({})

const repositoryUrls = Object.fromEntries(
	repositoryNames.map((name) => [
		name,
		pulumi.interpolate`${callerIdentity.accountId}.dkr.ecr.${region.name}.amazonaws.com/${name}`,
	]),
) as Record<(typeof repositoryNames)[number], pulumi.Output<string>>

const repositoryArns = Object.fromEntries(
	repositoryNames.map((name) => [
		name,
		pulumi.interpolate`arn:aws:ecr:${region.name}:${callerIdentity.accountId}:repository/${name}`,
	]),
) as Record<(typeof repositoryNames)[number], pulumi.Output<string>>

export { repositoryUrls, repositoryArns, repositoryNames }
