import { createDb } from '@/db/client'
import { deployments, projects, teams } from '@/db/schema'
import { and, desc, eq, isNull } from 'drizzle-orm'

/**
 * Application Data Queries
 * Handles fetching and aggregating application data
 */

export interface ApplicationListItem {
	id: string
	name: string
	slug: string
	repositoryUrl: string
	repositoryName: string
	framework: string | null
	status: 'building' | 'deployed' | 'failed' | 'idle'
	lastDeployedAt: string | null
	currentDeploymentId: string | null
	productionUrl: string | null
	updatedAt: string
}

/**
 * Gets all applications for a user
 * @param userId - User ID
 * @returns List of applications with status
 */
export async function getUserApplications(
	userId: string,
): Promise<ApplicationListItem[]> {
	const db = createDb()

	// Get teams the user is a member of
	const userTeams = await db.query.teams.findMany({
		where: (t, { exists, and, eq }) =>
			exists(
				db
					.select()
					.from(teams)
					.where(and(eq(teams.id, t.id))),
			),
		with: {
			members: {
				where: (m, { eq }) => eq(m.userId, userId),
			},
		},
	})

	const teamIds = userTeams
		.filter((t) => t.members.length > 0)
		.map((t) => t.id)

	if (teamIds.length === 0) {
		return []
	}

	// Get all projects for these teams
	const allProjects = []
	for (const teamId of teamIds) {
		const teamProjects = await db.query.projects.findMany({
			where: and(eq(projects.teamId, teamId), isNull(projects.deletedAt)),
			with: {
				currentDeployment: true,
				domains: {
					where: (d, { and, eq }) =>
						and(eq(d.environment, 'production'), eq(d.isPrimary, true)),
				},
			},
			orderBy: [desc(projects.updatedAt)],
		})
		allProjects.push(...teamProjects)
	}

	// Transform to list items with aggregated status
	return allProjects.map((project) => {
		let status: ApplicationListItem['status'] = 'idle'
		let lastDeployedAt: string | null = null

		if (project.currentDeployment) {
			lastDeployedAt = project.currentDeployment.readyAt

			switch (project.currentDeployment.status) {
				case 'queued':
				case 'building':
				case 'deploying':
					status = 'building'
					break
				case 'ready':
					status = 'deployed'
					break
				case 'failed':
				case 'canceled':
					status = 'failed'
					break
			}
		}

		const productionDomain = project.domains[0]
		const productionUrl = productionDomain
			? `https://${productionDomain.domain}`
			: null

		return {
			id: project.id,
			name: project.name,
			slug: project.slug,
			repositoryUrl: project.repositoryUrl,
			repositoryName: project.repositoryName,
			framework: project.framework,
			status,
			lastDeployedAt,
			currentDeploymentId: project.currentProductionDeploymentId,
			productionUrl,
			updatedAt: project.updatedAt,
		}
	})
}

/**
 * Gets detailed information about a single application
 * @param projectId - Project ID
 * @returns Application details with deployments
 */
export async function getApplicationDetails(projectId: string) {
	const db = createDb()

	const project = await db.query.projects.findFirst({
		where: eq(projects.id, projectId),
		with: {
			team: true,
			currentDeployment: true,
			deployments: {
				orderBy: [desc(deployments.createdAt)],
				limit: 10,
			},
			domains: true,
			environmentVariables: true,
			previewEnvironments: {
				where: (p, { eq }) => eq(p.status, 'active'),
				with: {
					currentDeployment: true,
				},
			},
		},
	})

	if (!project) {
		return null
	}

	return {
		...project,
		// Don't expose encrypted values
		environmentVariables: project.environmentVariables.map((v) => ({
			id: v.id,
			key: v.key,
			target: v.target,
			type: v.type,
		})),
	}
}

/**
 * Gets deployment details
 * @param deploymentId - Deployment ID
 * @returns Deployment details with logs
 */
export async function getDeploymentDetails(deploymentId: string) {
	const db = createDb()

	return db.query.deployments.findFirst({
		where: eq(deployments.id, deploymentId),
		with: {
			project: true,
			buildLogs: {
				orderBy: (logs, { asc }) => [asc(logs.timestamp)],
			},
		},
	})
}

/**
 * Gets deployment statistics for a project
 * @param projectId - Project ID
 * @returns Deployment statistics
 */
export async function getDeploymentStats(projectId: string) {
	const db = createDb()

	const allDeployments = await db.query.deployments.findMany({
		where: eq(deployments.projectId, projectId),
	})

	const now = new Date()
	const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

	const recent = allDeployments.filter(
		(d) => new Date(d.createdAt) >= last30Days,
	)

	const totalDeployments = allDeployments.length
	const successfulDeployments = allDeployments.filter(
		(d) => d.status === 'ready',
	).length
	const failedDeployments = allDeployments.filter(
		(d) => d.status === 'failed',
	).length

	const recentDeployments = recent.length
	const recentSuccessful = recent.filter((d) => d.status === 'ready').length
	const recentFailed = recent.filter((d) => d.status === 'failed').length

	// Calculate average build time
	const completedBuilds = allDeployments.filter(
		(d) => d.buildStartedAt && d.buildFinishedAt,
	)
	let avgBuildTime = 0
	if (completedBuilds.length > 0) {
		const totalBuildTime = completedBuilds.reduce((sum, d) => {
			const start = new Date(d.buildStartedAt!).getTime()
			const end = new Date(d.buildFinishedAt!).getTime()
			return sum + (end - start)
		}, 0)
		avgBuildTime = Math.round(totalBuildTime / completedBuilds.length / 1000) // in seconds
	}

	return {
		total: {
			deployments: totalDeployments,
			successful: successfulDeployments,
			failed: failedDeployments,
			successRate:
				totalDeployments > 0
					? Math.round((successfulDeployments / totalDeployments) * 100)
					: 0,
		},
		last30Days: {
			deployments: recentDeployments,
			successful: recentSuccessful,
			failed: recentFailed,
			successRate:
				recentDeployments > 0
					? Math.round((recentSuccessful / recentDeployments) * 100)
					: 0,
		},
		avgBuildTimeSeconds: avgBuildTime,
	}
}

/**
 * Gets recent activity for a project
 * @param projectId - Project ID
 * @param limit - Number of activities to return
 * @returns Recent activity list
 */
export async function getRecentActivity(projectId: string, limit = 20) {
	const db = createDb()

	const recentDeployments = await db.query.deployments.findMany({
		where: eq(deployments.projectId, projectId),
		orderBy: [desc(deployments.createdAt)],
		limit,
		with: {
			triggeredByUser: true,
		},
	})

	return recentDeployments.map((d) => ({
		id: d.id,
		type: 'deployment' as const,
		status: d.status,
		environment: d.environment,
		branch: d.branch,
		commitSha: d.commitSha,
		commitMessage: d.commitMessage,
		triggeredBy: d.triggeredBy,
		triggeredByUser: d.triggeredByUser
			? {
					id: d.triggeredByUser.id,
					name: d.triggeredByUser.name,
					avatarUrl: d.triggeredByUser.avatarUrl,
				}
			: null,
		createdAt: d.createdAt,
	}))
}

/**
 * Searches projects by name or repository
 * @param userId - User ID
 * @param query - Search query
 * @returns Matching projects
 */
export async function searchProjects(
	userId: string,
	query: string,
): Promise<ApplicationListItem[]> {
	const allApps = await getUserApplications(userId)

	const lowerQuery = query.toLowerCase()
	return allApps.filter(
		(app) =>
			app.name.toLowerCase().includes(lowerQuery) ||
			app.repositoryName.toLowerCase().includes(lowerQuery) ||
			app.slug.toLowerCase().includes(lowerQuery),
	)
}
