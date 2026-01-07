import { createDb } from '@/db/client'
import { buildLogs, deployments, projects } from '@/db/schema'
import { exec } from 'child_process'
import { eq } from 'drizzle-orm'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Build Execution Engine
 * Handles triggering, executing, and monitoring builds
 */

export interface TriggerBuildInput {
	projectId: string
	commitSha: string
	commitMessage: string
	commitAuthorName: string
	commitAuthorEmail: string
	branch: string
	environment: 'production' | 'preview'
	triggeredBy: 'push' | 'pull_request' | 'manual' | 'rollback' | 'redeploy'
	triggeredByUserId?: string
	pullRequestNumber?: number
	pullRequestTitle?: string
}

/**
 * Triggers a new build for a project
 * @param input - Build trigger configuration
 * @returns Deployment ID
 */
export async function triggerBuild(
	input: TriggerBuildInput,
): Promise<string> {
	const db = createDb()

	// Create deployment record
	const [deployment] = await db
		.insert(deployments)
		.values({
			id: crypto.randomUUID(),
			projectId: input.projectId,
			environment: input.environment,
			status: 'queued',
			commitSha: input.commitSha,
			commitMessage: input.commitMessage,
			commitAuthorName: input.commitAuthorName,
			commitAuthorEmail: input.commitAuthorEmail,
			branch: input.branch,
			pullRequestNumber: input.pullRequestNumber || null,
			pullRequestTitle: input.pullRequestTitle || null,
			triggeredBy: input.triggeredBy,
			triggeredByUserId: input.triggeredByUserId || null,
		})
		.returning()

	if (!deployment) {
		throw new Error('Failed to create deployment')
	}

	// Queue the build for execution (in production, use a job queue like BullMQ)
	// For now, execute immediately in background
	executeBuild(deployment.id).catch((error) => {
		console.error(`Build ${deployment.id} failed:`, error)
	})

	return deployment.id
}

/**
 * Executes a build for a deployment
 * @param deploymentId - Deployment ID to build
 */
export async function executeBuild(deploymentId: string): Promise<void> {
	const db = createDb()

	// Get deployment and project info
	const deployment = await db.query.deployments.findFirst({
		where: eq(deployments.id, deploymentId),
	})

	if (!deployment) {
		throw new Error('Deployment not found')
	}

	const project = await db.query.projects.findFirst({
		where: eq(projects.id, deployment.projectId),
		with: {
			environmentVariables: true,
		},
	})

	if (!project) {
		throw new Error('Project not found')
	}

	let buildDir: string | null = null

	try {
		// Update status to building
		await db
			.update(deployments)
			.set({
				status: 'building',
				buildStartedAt: new Date().toISOString(),
			})
			.where(eq(deployments.id, deploymentId))

		await addBuildLog(deploymentId, 'info', '🚀 Starting build...')
		await addBuildLog(
			deploymentId,
			'info',
			`Repository: ${project.repositoryUrl}`,
		)
		await addBuildLog(deploymentId, 'info', `Commit: ${deployment.commitSha}`)
		await addBuildLog(deploymentId, 'info', `Branch: ${deployment.branch}`)

		// Create temporary build directory
		buildDir = await mkdtemp(join(tmpdir(), 'paas-build-'))
		await addBuildLog(deploymentId, 'info', `Build directory: ${buildDir}`)

		// Clone repository
		await addBuildLog(deploymentId, 'info', '📥 Cloning repository...')
		await runCommand(
			deploymentId,
			`git clone --depth 1 --branch ${deployment.branch} ${project.repositoryUrl} ${buildDir}`,
		)

		// Checkout specific commit
		await addBuildLog(deploymentId, 'info', `🔍 Checking out ${deployment.commitSha}...`)
		await runCommand(deploymentId, `git checkout ${deployment.commitSha}`, {
			cwd: buildDir,
		})

		// Detect package manager
		const packageManager = await detectPackageManager(buildDir)
		await addBuildLog(
			deploymentId,
			'info',
			`📦 Detected package manager: ${packageManager}`,
		)

		// Install dependencies
		await addBuildLog(deploymentId, 'info', '⬇️  Installing dependencies...')
		const installCommand =
			project.installCommand || getDefaultInstallCommand(packageManager)
		await runCommand(deploymentId, installCommand, { cwd: buildDir })

		// Run build
		if (project.buildCommand) {
			await addBuildLog(deploymentId, 'info', '🔨 Building application...')
			await runCommand(deploymentId, project.buildCommand, {
				cwd: buildDir,
				env: buildEnvVars(project),
			})
		} else {
			await addBuildLog(
				deploymentId,
				'warn',
				'⚠️  No build command configured, skipping build step',
			)
		}

		// Store build artifacts (in production, upload to S3/R2)
		const artifactPath = join(
			buildDir,
			project.outputDirectory || 'dist',
		)
		await addBuildLog(
			deploymentId,
			'info',
			`📦 Build artifacts: ${artifactPath}`,
		)

		// Update deployment status
		await db
			.update(deployments)
			.set({
				status: 'deploying',
				buildFinishedAt: new Date().toISOString(),
				artifactUrl: artifactPath, // In production, this would be S3 URL
			})
			.where(eq(deployments.id, deploymentId))

		await addBuildLog(deploymentId, 'info', '✅ Build completed successfully')

		// Trigger container deployment
		const { deployContainer } = await import('./containers')
		await deployContainer(deploymentId, artifactPath)
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)

		await addBuildLog(deploymentId, 'error', `❌ Build failed: ${errorMessage}`)

		await db
			.update(deployments)
			.set({
				status: 'failed',
				buildFinishedAt: new Date().toISOString(),
				errorMessage,
				errorCode: 'BUILD_FAILED',
			})
			.where(eq(deployments.id, deploymentId))

		throw error
	} finally {
		// Cleanup build directory
		if (buildDir) {
			try {
				await rm(buildDir, { recursive: true, force: true })
			} catch (error) {
				console.error('Failed to cleanup build directory:', error)
			}
		}
	}
}

/**
 * Runs a shell command and logs output
 */
async function runCommand(
	deploymentId: string,
	command: string,
	options?: { cwd?: string; env?: Record<string, string> },
): Promise<void> {
	try {
		const { stdout, stderr } = await execAsync(command, {
			cwd: options?.cwd,
			env: { ...process.env, ...options?.env },
			maxBuffer: 10 * 1024 * 1024, // 10MB
		})

		if (stdout) {
			await addBuildLog(deploymentId, 'info', stdout.trim())
		}
		if (stderr) {
			await addBuildLog(deploymentId, 'warn', stderr.trim())
		}
	} catch (error: any) {
		const errorMessage = error.message || String(error)
		await addBuildLog(deploymentId, 'error', errorMessage)
		throw error
	}
}

/**
 * Adds a build log entry
 */
async function addBuildLog(
	deploymentId: string,
	level: 'debug' | 'info' | 'warn' | 'error',
	message: string,
): Promise<void> {
	const db = createDb()

	await db.insert(buildLogs).values({
		id: crypto.randomUUID(),
		deploymentId,
		timestamp: new Date().toISOString(),
		level,
		message,
		source: 'build',
	})
}

/**
 * Detects the package manager used in a project
 */
async function detectPackageManager(buildDir: string): Promise<string> {
	try {
		// Check for lock files
		const { stdout } = await execAsync(`ls ${buildDir}`, { cwd: buildDir })
		const files = stdout.toLowerCase()

		if (files.includes('pnpm-lock.yaml')) return 'pnpm'
		if (files.includes('yarn.lock')) return 'yarn'
		if (files.includes('package-lock.json')) return 'npm'

		return 'npm' // default
	} catch {
		return 'npm'
	}
}

/**
 * Gets default install command for package manager
 */
function getDefaultInstallCommand(packageManager: string): string {
	switch (packageManager) {
		case 'pnpm':
			return 'pnpm install'
		case 'yarn':
			return 'yarn install'
		case 'npm':
		default:
			return 'npm install'
	}
}

/**
 * Builds environment variables for build process
 */
function buildEnvVars(project: any): Record<string, string> {
	const env: Record<string, string> = {
		NODE_ENV: 'production',
		NODE_VERSION: project.nodeVersion || '20',
	}

	// Add project environment variables
	// TODO: decrypt encrypted values
	if (project.environmentVariables) {
		for (const envVar of project.environmentVariables) {
			env[envVar.key] = envVar.valueEncrypted
		}
	}

	return env
}

/**
 * Gets build logs for a deployment
 */
export async function getBuildLogs(deploymentId: string) {
	const db = createDb()

	return db.query.buildLogs.findMany({
		where: eq(buildLogs.deploymentId, deploymentId),
		orderBy: (logs, { asc }) => [asc(logs.timestamp)],
	})
}

/**
 * Streams build logs in real-time (for SSE endpoint)
 * @yields Build log entries as they become available
 */
export async function* streamBuildLogs(deploymentId: string) {
	const db = createDb()
	let lastTimestamp = new Date('1970-01-01').toISOString()

	// Poll for new logs every second
	while (true) {
		const newLogs = await db.query.buildLogs.findMany({
			where: (logs, { and, eq, gt }) =>
				and(eq(logs.deploymentId, deploymentId), gt(logs.timestamp, lastTimestamp)),
			orderBy: (logs, { asc }) => [asc(logs.timestamp)],
		})

		for (const log of newLogs) {
			yield log
			lastTimestamp = log.timestamp
		}

		// Check if deployment is finished
		const deployment = await db.query.deployments.findFirst({
			where: eq(deployments.id, deploymentId),
		})

		if (
			deployment &&
			(deployment.status === 'ready' ||
				deployment.status === 'failed' ||
				deployment.status === 'canceled')
		) {
			break
		}

		await new Promise((resolve) => setTimeout(resolve, 1000))
	}
}
