import { dag, func, object, Secret } from '@dagger.io/dagger'
import {
	buildPublishGitopsStateArgs,
	buildPublishAppImagesArgs,
	derivePublishTags,
	validateCiRunInput,
} from './ci-entrypoint.ts'
import { collectChangedApps } from './preview/changed-apps.ts'
import { buildChartPublishPlan } from './chart/publish.ts'
import {
	buildGitopsPublishPlan,
	buildGitopsPushArgs,
	resolveGitopsSourceMetadata,
} from './gitops/publish.ts'
import {
	buildGitopsBundleFiles,
	loadAppDefinitionsFromContents,
} from './gitops/render.ts'
import { buildAppImagePublishPlan } from './images/publish.ts'

export type PublishGitopsStateResult = {
	references: string[]
}

export type PublishAppReleaseChartResult = {
	reference: string
	version: string
}

export type PublishAppImagesResult = {
	references: string[]
}

export type CiRunResult = {
	skipped: boolean
	references: string[]
	plan: string
}

export type CiRunPlanSummaryInput = {
	mode: string
	event: string
	tags: string[]
	apps: string[]
	publishTarget: string
	publishArgs: string[]
	skipped: boolean
}

export function summarizeCiRunPlan(input: CiRunPlanSummaryInput): string {
	const lines = [
		`ci-run mode=${input.mode}`,
		`event=${input.event}`,
		`apps=${input.apps.length ? input.apps.join(',') : 'none'}`,
		`publish=${input.publishTarget} ${input.publishArgs.join(' ')}`,
		`tags=${input.tags.join(',')}`,
	]
	if (input.skipped) {
		lines.push('skipped: no changes detected')
	}
	return lines.join('\n')
}

async function resolveChangedFilesFromWorkspace(
	baseRef: string,
	headRef: string,
): Promise<string[] | undefined> {
	try {
		const stdout = await dag
			.container()
			.from('alpine/git:2.49.1')
			.withoutEntrypoint()
			.withMountedDirectory('/repo', dag.currentEnv().workspace())
			.withWorkdir('/repo')
			.withExec(['git', 'diff', '--name-only', baseRef, headRef])
			.stdout()

		return stdout
			.split('\n')
			.map((file) => file.trim())
			.filter(Boolean)
	} catch {
		return undefined
	}
}

@object()
export class PreviewPipeline {
	@func()
	async ciRun(
		mode: string,
		event: string,
		sha: string,
		githubToken: Secret,
		prNumber?: number,
		registry = 'ghcr.io/aamini-stack',
		githubActor = 'github-actions[bot]',
		baseRef = 'main',
		headRef = 'HEAD',
	): Promise<CiRunResult> {
		validateCiRunInput({ mode, event, sha, prNumber })
		const tags = derivePublishTags({ event, sha, prNumber })

		if (mode !== 'artifacts') {
			const args = buildPublishGitopsStateArgs({
				registry,
				tags,
				githubActor,
			})
			const plan = summarizeCiRunPlan({
				mode,
				event,
				tags,
				apps: [],
				publishTarget: 'publish-gitops-state',
				publishArgs: args.slice(2),
				skipped: false,
			})
			console.log(plan)
			const result = await this.publishGitopsState(
				registry,
				tags,
				githubToken,
				githubActor,
			)
			return { skipped: false, references: result.references, plan }
		}

		const apps = await collectChangedApps({
			baseRef,
			headRef,
			changedFiles: await resolveChangedFilesFromWorkspace(baseRef, headRef),
		})
		if (apps.length === 0) {
			const plan = summarizeCiRunPlan({
				mode,
				event,
				tags,
				apps: [],
				publishTarget: 'publish-app-images',
				publishArgs: [],
				skipped: true,
			})
			console.log(plan)
			return {
				skipped: true,
				references: [],
				plan,
			}
		}

		const args = buildPublishAppImagesArgs({
			registry,
			apps,
			tags,
			githubActor,
		})
		const plan = summarizeCiRunPlan({
			mode,
			event,
			tags,
			apps,
			publishTarget: 'publish-app-images',
			publishArgs: args.slice(2),
			skipped: false,
		})
		console.log(plan)
		return {
			skipped: false,
			references: await this.publishAppImages(
				registry,
				apps,
				tags,
				githubToken,
				githubActor,
			).then((result) => result.references),
			plan,
		}
	}

	@func()
	async publishAppReleaseChart(
		registry: string,
		githubToken: Secret,
		githubActor = 'github-actions[bot]',
		chartPath = 'packages/infra/charts/app-release',
		version = '0.1.0',
	): Promise<PublishAppReleaseChartResult> {
		const plan = buildChartPublishPlan({
			chartPath,
			registry,
			version,
			githubActor,
		})
		const context = dag.currentEnv().workspace()

		await dag
			.container()
			.from('alpine/helm:3.18.6')
			.withoutEntrypoint()
			.withMountedDirectory(plan.mountPath, context.directory(plan.chartPath))
			.withSecretVariable('HELM_REGISTRY_PASSWORD', githubToken)
			.withExec(['sh', '-c', `helm ${plan.loginArgs.join(' ')}`])
			.withExec(['helm', ...plan.packageArgs])
			.withExec(['helm', ...plan.pushArgs])
			.withExec(['helm', ...plan.verifyArgs])
			.sync()

		return {
			reference: `${registry}:${version}`,
			version,
		}
	}

	@func()
	async publishAppImages(
		registry: string,
		apps: string[],
		tags: string[],
		githubToken: Secret,
		githubActor = 'github-actions[bot]',
		dockerfile = 'Dockerfile',
	): Promise<PublishAppImagesResult> {
		const plan = buildAppImagePublishPlan({
			dockerfile,
			registry,
			apps,
			tags,
		})
		const context = dag.currentEnv().workspace().directory(plan.contextPath)
		const references: string[] = []

		for (const publishTarget of plan.publishes) {
			const image = context
				.dockerBuild({
					dockerfile: plan.dockerfile,
					platform: 'linux/amd64',
					buildArgs: publishTarget.buildArgs,
					target: 'production',
				})
				.withRegistryAuth('ghcr.io', githubActor, githubToken)

			await image.publish(publishTarget.references[0], {
				platformVariants: [],
			})

			for (const reference of publishTarget.references.slice(1)) {
				await image.publish(reference, {
					platformVariants: [],
				})
			}

			references.push(...publishTarget.references)
		}

		return { references }
	}

	@func()
	async publishGitopsState(
		registry: string,
		tags: string[],
		githubToken: Secret,
		githubActor = 'github-actions[bot]',
	): Promise<PublishGitopsStateResult> {
		const source = dag.currentEnv().workspace()
		const appDefinitions = loadAppDefinitionsFromContents(
			await Promise.all(
				(await source.directory('packages/infra/manifests/apps').entries())
					.filter((entry) => entry.endsWith('.yaml'))
					.sort()
					.map((entry) =>
						source.file(`packages/infra/manifests/apps/${entry}`).contents(),
					),
			),
		)
		const renderedDirectory = Object.entries(
			buildGitopsBundleFiles({
				controllers: await source
					.file('packages/infra/manifests/platform/controllers.yaml')
					.contents(),
				networking: await source
					.file('packages/infra/manifests/platform/networking.yaml')
					.contents(),
				previews: await source
					.file('packages/infra/manifests/platform/previews.yaml')
					.contents(),
				apps: appDefinitions,
				appManifests: (
					await Promise.all(
						appDefinitions.map(async (app) => {
							const manifestPath = `apps/${app.name}/k8s/sealed-secret.yaml`
							try {
								return (await source.file(manifestPath).contents()).trim()
							} catch {
								return ''
							}
						}),
					)
				).filter(Boolean),
			}),
		).reduce((directory, [filePath, contents]) => {
			return directory.withNewFile(filePath, contents)
		}, dag.directory())
		const plan = buildGitopsPublishPlan({
			registry,
			tags,
			sourcePath: '/tmp/manifests',
			...resolveGitopsSourceMetadata({
				tags,
				githubServerUrl: process.env.GITHUB_SERVER_URL,
				githubRepository: process.env.GITHUB_REPOSITORY,
				githubRefName: process.env.GITHUB_REF_NAME,
				githubSha: process.env.GITHUB_SHA,
			}),
		})
		let publish = dag
			.container()
			.from('ghcr.io/fluxcd/flux-cli:v2.6.4')
			.withUser('root')
			.withDirectory('/tmp/manifests', renderedDirectory)
			.withWorkdir('/tmp')
			.withSecretVariable('GITHUB_TOKEN', githubToken)
			.withoutEntrypoint()

		for (const reference of plan.references) {
			publish = publish.withExec([
				'sh',
				'-c',
				[
					'flux',
					...buildGitopsPushArgs({
						reference,
						sourcePath: plan.sourcePath,
						source: plan.source,
						revision: plan.revision,
						creds: `${githubActor}:$GITHUB_TOKEN`,
					}),
				].join(' '),
			])
		}

		await publish.sync()

		return {
			references: plan.references,
		}
	}
}
