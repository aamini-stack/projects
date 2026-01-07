import { createDb } from '@/db/client'
import { buildLogs, deployments, domains, projects } from '@/db/schema'
import { exec } from 'child_process'
import { eq } from 'drizzle-orm'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Container Management
 * Handles Docker container lifecycle for deployments
 */

export interface ContainerConfig {
	port: number
	healthCheckPath?: string
	env?: Record<string, string>
}

/**
 * Deploys a build as a Docker container
 * @param deploymentId - Deployment ID
 * @param artifactPath - Path to build artifacts
 */
export async function deployContainer(
	deploymentId: string,
	artifactPath: string,
): Promise<void> {
	const db = createDb()

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

	try {
		await addDeployLog(deploymentId, 'info', '🐳 Preparing container deployment...')

		// Generate container name
		const containerName = `${project.slug}-${deployment.environment}-${deploymentId.slice(0, 8)}`

		// Assign port (in production, use port management system)
		const port = await assignPort(deploymentId)
		await addDeployLog(deploymentId, 'info', `📍 Assigned port: ${port}`)

		// Build container image
		await addDeployLog(deploymentId, 'info', '🏗️  Building container image...')
		await buildContainerImage(
			deploymentId,
			containerName,
			artifactPath,
			project,
		)

		// Stop and remove old containers for this project/environment
		if (deployment.environment === 'production') {
			await stopProductionContainers(project.id)
		}

		// Start container
		await addDeployLog(deploymentId, 'info', '🚀 Starting container...')
		await startContainer(deploymentId, containerName, port, project)

		// Wait for health check
		await addDeployLog(deploymentId, 'info', '🏥 Performing health check...')
		const healthy = await waitForHealthy(port, '/health', 30)

		if (!healthy) {
			throw new Error('Container failed health check')
		}

		await addDeployLog(deploymentId, 'info', '✅ Container is healthy')

		// Create or update domain
		const url = await assignDomain(project, deployment, port)
		await addDeployLog(deploymentId, 'info', `🌐 Deployed to: ${url}`)

		// Update deployment status
		await db
			.update(deployments)
			.set({
				status: 'ready',
				deployStartedAt: deployment.buildFinishedAt,
				readyAt: new Date().toISOString(),
			})
			.where(eq(deployments.id, deploymentId))

		// Update project's current production deployment
		if (deployment.environment === 'production') {
			await db
				.update(projects)
				.set({ currentProductionDeploymentId: deploymentId })
				.where(eq(projects.id, project.id))
		}

		await addDeployLog(
			deploymentId,
			'info',
			'🎉 Deployment completed successfully',
		)
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)

		await addDeployLog(
			deploymentId,
			'error',
			`❌ Deployment failed: ${errorMessage}`,
		)

		await db
			.update(deployments)
			.set({
				status: 'failed',
				errorMessage,
				errorCode: 'DEPLOY_FAILED',
			})
			.where(eq(deployments.id, deploymentId))

		throw error
	}
}

/**
 * Builds a Docker image for the deployment
 */
async function buildContainerImage(
	deploymentId: string,
	containerName: string,
	_artifactPath: string,
	project: any,
): Promise<void> {
	// Create Dockerfile dynamically based on framework
	// const dockerfile = generateDockerfile(project, artifactPath)

	// In production, write Dockerfile and build with Docker API
	// For now, use a simple Node.js image
	const imageName = `paas/${containerName}`

	await addDeployLog(
		deploymentId,
		'info',
		`Building image: ${imageName}`,
	)

	// Simplified: just tag a base image for now
	// In production, this would build from Dockerfile with artifacts
	try {
		await execAsync(`docker pull node:${project.nodeVersion}-alpine`)
	} catch {
		await addDeployLog(
			deploymentId,
			'warn',
			'Failed to pull base image, continuing...',
		)
	}
}

/**
 * Starts a Docker container
 */
async function startContainer(
	deploymentId: string,
	containerName: string,
	port: number,
	project: any,
): Promise<void> {
	const env = buildContainerEnv(project)
	const envFlags = Object.entries(env)
		.map(([key, value]) => `-e ${key}="${value}"`)
		.join(' ')

	// Start container
	// In production, use Docker API or Kubernetes
	const command = `
		docker run -d \
		--name ${containerName} \
		--restart unless-stopped \
		-p ${port}:3000 \
		${envFlags} \
		node:${project.nodeVersion}-alpine \
		sh -c "while true; do sleep 1000; done"
	`.replace(/\s+/g, ' ')

	try {
		await execAsync(command)
		await addDeployLog(
			deploymentId,
			'info',
			`Container ${containerName} started`,
		)
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		throw new Error(`Failed to start container: ${errorMessage}`)
	}
}

/**
 * Stops all production containers for a project
 */
async function stopProductionContainers(projectId: string): Promise<void> {
	const db = createDb()

	const project = await db.query.projects.findFirst({
		where: eq(projects.id, projectId),
	})

	if (!project) return

	// Find running containers (simplified)
	try {
		const { stdout } = await execAsync(
			`docker ps --filter "name=${project.slug}-production" --format "{{.Names}}"`,
		)

		const containerNames = stdout.trim().split('\n').filter(Boolean)

		for (const name of containerNames) {
			try {
				await execAsync(`docker stop ${name}`)
				await execAsync(`docker rm ${name}`)
			} catch {
				// Ignore errors
			}
		}
	} catch {
		// Ignore errors
	}
}

/**
 * Assigns a port for the deployment
 * In production, use a port management system
 */
async function assignPort(_deploymentId: string): Promise<number> {
	// Simplified: return a random port between 3000-4000
	// In production, track used ports in database
	return 3000 + Math.floor(Math.random() * 1000)
}

/**
 * Waits for container to become healthy
 */
async function waitForHealthy(
	port: number,
	healthPath: string,
	timeoutSeconds: number,
): Promise<boolean> {
	const startTime = Date.now()
	const timeoutMs = timeoutSeconds * 1000

	while (Date.now() - startTime < timeoutMs) {
		try {
			const response = await fetch(`http://localhost:${port}${healthPath}`)
			if (response.ok) {
				return true
			}
		} catch {
			// Container not ready yet
		}

		await new Promise((resolve) => setTimeout(resolve, 1000))
	}

	return false
}

/**
 * Assigns a domain to the deployment
 */
async function assignDomain(
	project: any,
	deployment: any,
	port: number,
): Promise<string> {
	const db = createDb()

	let domain: string

	if (deployment.environment === 'production') {
		// Production domain
		domain = `${project.slug}.paas.local`
	} else {
		// Preview domain
		const prNumber = deployment.pullRequestNumber
		domain = `pr-${prNumber}-${project.slug}.paas.local`
	}

	// Create or update domain record
	await db
		.insert(domains)
		.values({
			id: crypto.randomUUID(),
			projectId: project.id,
			domain,
			type: 'auto',
			environment: deployment.environment,
			sslStatus: 'active',
			dnsStatus: 'verified',
			isPrimary: deployment.environment === 'production',
		})
		.onConflictDoUpdate({
			target: domains.domain,
			set: {
				updatedAt: new Date().toISOString(),
			},
		})

	// In production, configure reverse proxy (nginx/caddy/traefik) here

	return `http://${domain}:${port}`
}

/**
 * Builds environment variables for container
 */
function buildContainerEnv(project: any): Record<string, string> {
	const env: Record<string, string> = {
		NODE_ENV: 'production',
		PORT: '3000',
	}

	// Add project environment variables
	if (project.environmentVariables) {
		for (const envVar of project.environmentVariables) {
			// TODO: decrypt encrypted values
			env[envVar.key] = envVar.valueEncrypted
		}
	}

	return env
}

/**
 * Generates a Dockerfile for the project
 * Currently unused but kept for future use when we implement full Docker builds
 */
// function generateDockerfile(project: any, _artifactPath: string): string {
// 	return `
// FROM node:${project.nodeVersion}-alpine
//
// WORKDIR /app
//
// COPY package*.json ./
// RUN npm install --production
//
// COPY ${project.outputDirectory || 'dist'} ./dist
//
// EXPOSE 3000
//
// CMD ["npm", "start"]
// 	`.trim()
// }

/**
 * Adds a deployment log entry
 */
async function addDeployLog(
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
		source: 'deploy',
	})
}

/**
 * Gets container status
 */
export async function getContainerStatus(
	containerName: string,
): Promise<'running' | 'stopped' | 'unknown'> {
	try {
		const { stdout } = await execAsync(
			`docker inspect -f '{{.State.Status}}' ${containerName}`,
		)
		const status = stdout.trim()

		if (status === 'running') return 'running'
		if (status === 'exited' || status === 'stopped') return 'stopped'
		return 'unknown'
	} catch {
		return 'unknown'
	}
}

/**
 * Stops a container
 */
export async function stopContainer(containerName: string): Promise<void> {
	try {
		await execAsync(`docker stop ${containerName}`)
		await execAsync(`docker rm ${containerName}`)
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		throw new Error(`Failed to stop container: ${errorMessage}`)
	}
}
