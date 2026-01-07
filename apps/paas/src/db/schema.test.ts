import {
	testBuildLogs,
	testClusters,
	testDeployments,
	testDomains,
	testEnvVars,
	testNamespaces,
	testPreviewEnvironments,
	testProjects,
	testTeamMembers,
	testTeams,
	testUsers,
} from '@/db/__fixtures__/seed-data'
import {
	buildLogs,
	clusters,
	configurationHistory,
	deployments,
	domains,
	environmentVariables,
	iacExports,
	namespaces,
	previewEnvironments,
	projects,
	teamMembers,
	teams,
	users,
	webhookDeliveries,
} from '@/db/schema'
import { initDb, test } from '@/mocks/test-extend-server'
import { and, count, desc, eq } from 'drizzle-orm'
import { describe, expect } from 'vitest'

// =============================================================================
// User Tests
// =============================================================================
describe('users table', () => {
	initDb(async (db) => {
		await db.insert(users).values(testUsers)
	})

	test('can query users by email', async ({ db }) => {
		const result = await db.query.users.findFirst({
			where: eq(users.email, 'alice@example.com'),
		})

		expect(result).toBeDefined()
		expect(result?.name).toBe('Alice Developer')
		expect(result?.githubId).toBe('gh-alice-123')
	})

	test('can query users by github id', async ({ db }) => {
		const result = await db.query.users.findFirst({
			where: eq(users.githubId, 'gh-bob-456'),
		})

		expect(result).toBeDefined()
		expect(result?.email).toBe('bob@example.com')
	})

	test('all users have required fields', async ({ db }) => {
		const allUsers = await db.query.users.findMany()

		expect(allUsers).toHaveLength(3)
		for (const user of allUsers) {
			expect(user.id).toBeDefined()
			expect(user.email).toBeDefined()
			expect(user.name).toBeDefined()
			expect(user.createdAt).toBeDefined()
			expect(user.updatedAt).toBeDefined()
		}
	})

	test('email must be unique', async ({ db }) => {
		await expect(
			db.insert(users).values({
				id: 'user-duplicate',
				email: 'alice@example.com', // Already exists
				name: 'Duplicate User',
			}),
		).rejects.toThrow()
	})
})

// =============================================================================
// Teams & Membership Tests
// =============================================================================
describe('teams and membership', () => {
	initDb(async (db) => {
		await db.insert(users).values(testUsers)
		await db.insert(teams).values(testTeams)
		await db.insert(teamMembers).values(testTeamMembers)
	})

	test('can query team by slug', async ({ db }) => {
		const result = await db.query.teams.findFirst({
			where: eq(teams.slug, 'acme-corp'),
		})

		expect(result).toBeDefined()
		expect(result?.name).toBe('Acme Corp')
		expect(result?.plan).toBe('pro')
	})

	test('can get team members with relations', async ({ db }) => {
		const result = await db.query.teams.findFirst({
			where: eq(teams.id, 'team-1'),
			with: {
				members: {
					with: {
						user: true,
					},
				},
			},
		})

		expect(result).toBeDefined()
		expect(result?.members).toHaveLength(2)
		expect(result?.members.map((m) => m.user.email).sort()).toEqual([
			'alice@example.com',
			'bob@example.com',
		])
	})

	test('can find owner of team', async ({ db }) => {
		const owner = await db.query.teamMembers.findFirst({
			where: and(
				eq(teamMembers.teamId, 'team-1'),
				eq(teamMembers.role, 'owner'),
			),
			with: { user: true },
		})

		expect(owner?.user.email).toBe('alice@example.com')
	})

	test('user-team combination must be unique', async ({ db }) => {
		await expect(
			db.insert(teamMembers).values({
				id: 'tm-duplicate',
				teamId: 'team-1',
				userId: 'user-1', // Already a member
				role: 'member',
			}),
		).rejects.toThrow()
	})
})

// =============================================================================
// Projects Tests
// =============================================================================
describe('projects table', () => {
	initDb(async (db) => {
		await db.insert(users).values(testUsers)
		await db.insert(teams).values(testTeams)
		await db.insert(projects).values(testProjects)
	})

	test('can query project by team and slug', async ({ db }) => {
		const result = await db.query.projects.findFirst({
			where: and(
				eq(projects.teamId, 'team-1'),
				eq(projects.slug, 'ecommerce-frontend'),
			),
		})

		expect(result).toBeDefined()
		expect(result?.name).toBe('E-commerce Frontend')
		expect(result?.framework).toBe('nextjs')
		expect(result?.autoDeploy).toBe(true)
	})

	test('can get projects for a team', async ({ db }) => {
		const teamProjects = await db.query.projects.findMany({
			where: eq(projects.teamId, 'team-1'),
		})

		expect(teamProjects).toHaveLength(2)
		expect(teamProjects.map((p) => p.name).sort()).toEqual([
			'API Backend',
			'E-commerce Frontend',
		])
	})

	test('project has team relation', async ({ db }) => {
		const result = await db.query.projects.findFirst({
			where: eq(projects.id, 'proj-1'),
			with: { team: true },
		})

		expect(result?.team.name).toBe('Acme Corp')
		expect(result?.team.slug).toBe('acme-corp')
	})

	test('team-slug combination must be unique', async ({ db }) => {
		await expect(
			db.insert(projects).values({
				id: 'proj-duplicate',
				teamId: 'team-1',
				name: 'Duplicate Project',
				slug: 'ecommerce-frontend', // Already exists for this team
				repositoryUrl: 'https://github.com/acme/duplicate',
				repositoryId: 'repo-dup',
				repositoryOwner: 'acme',
				repositoryName: 'duplicate',
				webhookSecret: 'secret',
			}),
		).rejects.toThrow()
	})
})

// =============================================================================
// Deployments Tests
// =============================================================================
describe('deployments table', () => {
	initDb(async (db) => {
		await db.insert(users).values(testUsers)
		await db.insert(teams).values(testTeams)
		await db.insert(projects).values(testProjects)
		await db.insert(deployments).values(testDeployments)
	})

	test('can query deployments by project', async ({ db }) => {
		const projectDeployments = await db.query.deployments.findMany({
			where: eq(deployments.projectId, 'proj-1'),
			orderBy: desc(deployments.createdAt),
		})

		expect(projectDeployments).toHaveLength(3)
	})

	test('can filter by environment', async ({ db }) => {
		const previewDeployments = await db.query.deployments.findMany({
			where: and(
				eq(deployments.projectId, 'proj-1'),
				eq(deployments.environment, 'preview'),
			),
		})

		expect(previewDeployments).toHaveLength(2)
	})

	test('can filter by status', async ({ db }) => {
		const readyDeployments = await db.query.deployments.findMany({
			where: eq(deployments.status, 'ready'),
		})

		expect(readyDeployments).toHaveLength(2)
		expect(readyDeployments.every((d) => d.readyAt !== null)).toBe(true)
	})

	test('failed deployment has error info', async ({ db }) => {
		const failed = await db.query.deployments.findFirst({
			where: eq(deployments.status, 'failed'),
		})

		expect(failed?.errorMessage).toBe('Build failed: Module not found')
		expect(failed?.errorCode).toBe('MODULE_NOT_FOUND')
	})

	test('deployment has project relation', async ({ db }) => {
		const result = await db.query.deployments.findFirst({
			where: eq(deployments.id, 'deploy-1'),
			with: { project: true },
		})

		expect(result?.project.name).toBe('E-commerce Frontend')
	})

	test('can calculate build duration', async ({ db }) => {
		const deployment = await db.query.deployments.findFirst({
			where: eq(deployments.id, 'deploy-1'),
		})

		if (deployment?.buildStartedAt && deployment?.buildFinishedAt) {
			const start = new Date(deployment.buildStartedAt).getTime()
			const end = new Date(deployment.buildFinishedAt).getTime()
			const durationMs = end - start
			expect(durationMs).toBe(150_000) // 2m 30s
		}
	})
})

// =============================================================================
// Domains Tests
// =============================================================================
describe('domains table', () => {
	initDb(async (db) => {
		await db.insert(users).values(testUsers)
		await db.insert(teams).values(testTeams)
		await db.insert(projects).values(testProjects)
		await db.insert(domains).values(testDomains)
	})

	test('can query domains by project', async ({ db }) => {
		const projectDomains = await db.query.domains.findMany({
			where: eq(domains.projectId, 'proj-1'),
		})

		expect(projectDomains).toHaveLength(3)
	})

	test('can find primary domain', async ({ db }) => {
		const primary = await db.query.domains.findFirst({
			where: and(eq(domains.projectId, 'proj-1'), eq(domains.isPrimary, true)),
		})

		expect(primary?.domain).toBe('ecommerce.acme.com')
		expect(primary?.type).toBe('custom')
	})

	test('can find preview domains', async ({ db }) => {
		const previewDomains = await db.query.domains.findMany({
			where: eq(domains.environment, 'preview'),
		})

		expect(previewDomains).toHaveLength(1)
		expect(previewDomains[0]?.branchPattern).toBe('feature/cart-fix')
	})

	test('domain must be globally unique', async ({ db }) => {
		await expect(
			db.insert(domains).values({
				id: 'domain-dup',
				projectId: 'proj-2',
				domain: 'ecommerce.acme.com', // Already exists
				type: 'custom',
			}),
		).rejects.toThrow()
	})
})

// =============================================================================
// Environment Variables Tests
// =============================================================================
describe('environment variables table', () => {
	initDb(async (db) => {
		await db.insert(users).values(testUsers)
		await db.insert(teams).values(testTeams)
		await db.insert(projects).values(testProjects)
		await db.insert(environmentVariables).values(testEnvVars)
	})

	test('can query env vars by project', async ({ db }) => {
		const envVars = await db.query.environmentVariables.findMany({
			where: eq(environmentVariables.projectId, 'proj-1'),
		})

		expect(envVars).toHaveLength(3)
	})

	test('env var key is unique per project', async ({ db }) => {
		await expect(
			db.insert(environmentVariables).values({
				id: 'env-dup',
				projectId: 'proj-1',
				key: 'DATABASE_URL', // Already exists
				valueEncrypted: 'encrypted:...',
			}),
		).rejects.toThrow()
	})

	test('can filter by target environment', async ({ db }) => {
		const envVars = await db.query.environmentVariables.findMany({
			where: eq(environmentVariables.projectId, 'proj-1'),
		})

		// Find env vars that apply to production
		const prodVars = envVars.filter((v) => v.target?.includes('production'))
		expect(prodVars.map((v) => v.key).sort()).toEqual([
			'API_KEY',
			'DATABASE_URL',
			'NODE_ENV',
		])
	})

	test('same key can exist in different projects', async ({ db }) => {
		// This should succeed - different project
		await db.insert(environmentVariables).values({
			id: 'env-other',
			projectId: 'proj-2',
			key: 'DATABASE_URL', // Same key, different project
			valueEncrypted: 'encrypted:other-db...',
		})

		const result = await db.query.environmentVariables.findFirst({
			where: and(
				eq(environmentVariables.projectId, 'proj-2'),
				eq(environmentVariables.key, 'DATABASE_URL'),
			),
		})

		expect(result).toBeDefined()
	})
})

// =============================================================================
// Preview Environments Tests
// =============================================================================
describe('preview environments table', () => {
	initDb(async (db) => {
		await db.insert(users).values(testUsers)
		await db.insert(teams).values(testTeams)
		await db.insert(projects).values(testProjects)
		await db.insert(deployments).values(testDeployments)
		await db.insert(previewEnvironments).values(testPreviewEnvironments)
	})

	test('can query preview envs by project', async ({ db }) => {
		const previews = await db.query.previewEnvironments.findMany({
			where: eq(previewEnvironments.projectId, 'proj-1'),
		})

		expect(previews).toHaveLength(2)
	})

	test('can filter by status', async ({ db }) => {
		const sleeping = await db.query.previewEnvironments.findMany({
			where: eq(previewEnvironments.status, 'sleeping'),
		})

		expect(sleeping).toHaveLength(1)
		expect(sleeping[0]?.branch).toBe('feature/deps-update')
	})

	test('preview has current deployment relation', async ({ db }) => {
		const preview = await db.query.previewEnvironments.findFirst({
			where: eq(previewEnvironments.id, 'preview-1'),
			with: { currentDeployment: true },
		})

		expect(preview?.currentDeployment?.status).toBe('building')
	})

	test('branch is unique per project', async ({ db }) => {
		await expect(
			db.insert(previewEnvironments).values({
				id: 'preview-dup',
				projectId: 'proj-1',
				branch: 'feature/cart-fix', // Already exists
			}),
		).rejects.toThrow()
	})
})

// =============================================================================
// Clusters & Namespaces Tests
// =============================================================================
describe('clusters and namespaces', () => {
	initDb(async (db) => {
		await db.insert(users).values(testUsers)
		await db.insert(teams).values(testTeams)
		await db.insert(projects).values(testProjects)
		await db.insert(clusters).values(testClusters)
		await db.insert(namespaces).values(testNamespaces)
	})

	test('can find default cluster', async ({ db }) => {
		const defaultCluster = await db.query.clusters.findFirst({
			where: eq(clusters.isDefault, true),
		})

		expect(defaultCluster?.name).toBe('US East Production')
		expect(defaultCluster?.provider).toBe('aws')
	})

	test('can get namespaces in cluster', async ({ db }) => {
		const result = await db.query.clusters.findFirst({
			where: eq(clusters.id, 'cluster-1'),
			with: { namespaces: true },
		})

		expect(result?.namespaces).toHaveLength(2)
	})

	test('namespace has project relation', async ({ db }) => {
		const ns = await db.query.namespaces.findFirst({
			where: eq(namespaces.id, 'ns-1'),
			with: { project: true, cluster: true },
		})

		expect(ns?.project.name).toBe('E-commerce Frontend')
		expect(ns?.cluster.name).toBe('US East Production')
	})

	test('namespace name must be unique per cluster', async ({ db }) => {
		await expect(
			db.insert(namespaces).values({
				id: 'ns-dup',
				clusterId: 'cluster-1',
				projectId: 'proj-3',
				name: 'acme-ecommerce-frontend', // Already exists in cluster-1
			}),
		).rejects.toThrow()
	})
})

// =============================================================================
// Build Logs Tests
// =============================================================================
describe('build logs table', () => {
	initDb(async (db) => {
		await db.insert(users).values(testUsers)
		await db.insert(teams).values(testTeams)
		await db.insert(projects).values(testProjects)
		await db.insert(deployments).values(testDeployments)
		await db.insert(buildLogs).values(testBuildLogs)
	})

	test('can query logs by deployment', async ({ db }) => {
		const logs = await db.query.buildLogs.findMany({
			where: eq(buildLogs.deploymentId, 'deploy-1'),
			orderBy: buildLogs.timestamp,
		})

		expect(logs).toHaveLength(4)
		expect(logs[0]?.message).toBe('Starting build...')
		expect(logs[3]?.message).toBe('Build completed successfully')
	})

	test('can filter by log level', async ({ db }) => {
		const errors = await db.query.buildLogs.findMany({
			where: eq(buildLogs.level, 'error'),
		})

		expect(errors).toHaveLength(1)
		expect(errors[0]?.deploymentId).toBe('deploy-3')
	})

	test('log has deployment relation', async ({ db }) => {
		const log = await db.query.buildLogs.findFirst({
			where: eq(buildLogs.id, 'log-5'),
			with: { deployment: true },
		})

		expect(log?.deployment.status).toBe('failed')
	})
})

// =============================================================================
// Audit Trail Tests
// =============================================================================
describe('configuration history table', () => {
	initDb(async (db) => {
		await db.insert(users).values(testUsers)
		await db.insert(teams).values(testTeams)
		await db.insert(projects).values(testProjects)
	})

	test('can record configuration changes', async ({ db }) => {
		await db.insert(configurationHistory).values({
			id: 'hist-1',
			projectId: 'proj-1',
			entityType: 'environment_variable',
			entityId: 'env-1',
			action: 'create',
			changedByUserId: 'user-1',
			changedVia: 'ui',
			previousValue: null,
			newValue: { key: 'DATABASE_URL', target: ['production'] },
		})

		const history = await db.query.configurationHistory.findFirst({
			where: eq(configurationHistory.id, 'hist-1'),
			with: { changedByUser: true },
		})

		expect(history?.entityType).toBe('environment_variable')
		expect(history?.action).toBe('create')
		expect(history?.changedByUser?.email).toBe('alice@example.com')
	})

	test('can record changes via terraform', async ({ db }) => {
		await db.insert(configurationHistory).values({
			id: 'hist-2',
			projectId: 'proj-1',
			entityType: 'project',
			entityId: 'proj-1',
			action: 'update',
			changedVia: 'terraform',
			previousValue: { buildCommand: 'npm run build' },
			newValue: { buildCommand: 'pnpm build' },
		})

		const history = await db.query.configurationHistory.findFirst({
			where: eq(configurationHistory.id, 'hist-2'),
		})

		expect(history?.changedVia).toBe('terraform')
		expect(history?.changedByUserId).toBeNull()
	})
})

// =============================================================================
// Webhook Deliveries Tests
// =============================================================================
describe('webhook deliveries table', () => {
	initDb(async (db) => {
		await db.insert(users).values(testUsers)
		await db.insert(teams).values(testTeams)
		await db.insert(projects).values(testProjects)
		await db.insert(deployments).values(testDeployments)
	})

	test('can record webhook delivery', async ({ db }) => {
		await db.insert(webhookDeliveries).values({
			id: 'wh-1',
			projectId: 'proj-1',
			deliveryId: 'gh-delivery-123',
			eventType: 'push',
			payload: { ref: 'refs/heads/main', commits: [] },
			signatureValid: true,
			processingStatus: 'completed',
			deploymentId: 'deploy-1',
		})

		const webhook = await db.query.webhookDeliveries.findFirst({
			where: eq(webhookDeliveries.id, 'wh-1'),
			with: { deployment: true },
		})

		expect(webhook?.eventType).toBe('push')
		expect(webhook?.deployment?.status).toBe('ready')
	})

	test('can track failed webhook processing', async ({ db }) => {
		await db.insert(webhookDeliveries).values({
			id: 'wh-2',
			projectId: 'proj-1',
			deliveryId: 'gh-delivery-456',
			eventType: 'push',
			payload: { ref: 'refs/heads/invalid' },
			signatureValid: false,
			processingStatus: 'failed',
			errorMessage: 'Invalid webhook signature',
		})

		const webhook = await db.query.webhookDeliveries.findFirst({
			where: eq(webhookDeliveries.processingStatus, 'failed'),
		})

		expect(webhook?.signatureValid).toBe(false)
		expect(webhook?.errorMessage).toBe('Invalid webhook signature')
	})

	test('delivery id must be unique', async ({ db }) => {
		await db.insert(webhookDeliveries).values({
			id: 'wh-3',
			deliveryId: 'unique-delivery',
			eventType: 'push',
			payload: {},
			signatureValid: true,
		})

		await expect(
			db.insert(webhookDeliveries).values({
				id: 'wh-4',
				deliveryId: 'unique-delivery', // Duplicate
				eventType: 'push',
				payload: {},
				signatureValid: true,
			}),
		).rejects.toThrow()
	})
})

// =============================================================================
// IaC Exports Tests
// =============================================================================
describe('iac exports table', () => {
	initDb(async (db) => {
		await db.insert(users).values(testUsers)
		await db.insert(teams).values(testTeams)
		await db.insert(projects).values(testProjects)
	})

	test('can record IaC export', async ({ db }) => {
		const terraformConfig = `
resource "paas_project" "frontend" {
  name = "E-commerce Frontend"
  framework = "nextjs"
}
`
		await db.insert(iacExports).values({
			id: 'export-1',
			projectId: 'proj-1',
			format: 'terraform',
			exportedByUserId: 'user-1',
			contentHash: 'sha256:abc123',
			content: terraformConfig,
		})

		const exported = await db.query.iacExports.findFirst({
			where: eq(iacExports.id, 'export-1'),
			with: { exportedByUser: true },
		})

		expect(exported?.format).toBe('terraform')
		expect(exported?.exportedByUser?.email).toBe('alice@example.com')
		expect(exported?.content).toContain('paas_project')
	})

	test('can track multiple export formats', async ({ db }) => {
		const formats = [
			'json',
			'terraform',
			'pulumi_ts',
			'pulumi_py',
			'shell',
		] as const

		for (const format of formats) {
			await db.insert(iacExports).values({
				id: `export-${format}`,
				projectId: 'proj-1',
				format,
				contentHash: `sha256:${format}`,
				content: `# ${format} export`,
			})
		}

		const exports = await db.query.iacExports.findMany({
			where: eq(iacExports.projectId, 'proj-1'),
		})

		expect(exports).toHaveLength(5)
		expect(
			exports.map((e) => e.format).sort((a, b) => a.localeCompare(b)),
		).toEqual([...formats].sort((a, b) => a.localeCompare(b)))
	})
})

// =============================================================================
// Cascade Delete Tests
// =============================================================================
describe('cascade deletes', () => {
	initDb(async (db) => {
		await db.insert(users).values(testUsers)
		await db.insert(teams).values(testTeams)
		await db.insert(teamMembers).values(testTeamMembers)
		await db.insert(projects).values(testProjects)
		await db.insert(deployments).values(testDeployments)
		await db.insert(buildLogs).values(testBuildLogs)
	})

	test('deleting project cascades to deployments', async ({ db }) => {
		// Verify deployments exist
		const beforeDeployments = await db.query.deployments.findMany({
			where: eq(deployments.projectId, 'proj-1'),
		})
		expect(beforeDeployments.length).toBeGreaterThan(0)

		// Delete project
		await db.delete(projects).where(eq(projects.id, 'proj-1'))

		// Deployments should be gone
		const afterDeployments = await db.query.deployments.findMany({
			where: eq(deployments.projectId, 'proj-1'),
		})
		expect(afterDeployments).toHaveLength(0)
	})

	test('deleting deployment cascades to build logs', async ({ db }) => {
		// Verify logs exist
		const beforeLogs = await db.query.buildLogs.findMany({
			where: eq(buildLogs.deploymentId, 'deploy-1'),
		})
		expect(beforeLogs.length).toBeGreaterThan(0)

		// Delete deployment
		await db.delete(deployments).where(eq(deployments.id, 'deploy-1'))

		// Logs should be gone
		const afterLogs = await db.query.buildLogs.findMany({
			where: eq(buildLogs.deploymentId, 'deploy-1'),
		})
		expect(afterLogs).toHaveLength(0)
	})

	test('deleting team cascades to team members', async ({ db }) => {
		// Verify members exist
		const beforeMembers = await db.query.teamMembers.findMany({
			where: eq(teamMembers.teamId, 'team-1'),
		})
		expect(beforeMembers.length).toBeGreaterThan(0)

		// Delete team
		await db.delete(teams).where(eq(teams.id, 'team-1'))

		// Members should be gone
		const afterMembers = await db.query.teamMembers.findMany({
			where: eq(teamMembers.teamId, 'team-1'),
		})
		expect(afterMembers).toHaveLength(0)
	})
})

// =============================================================================
// Aggregation Tests
// =============================================================================
describe('aggregations', () => {
	initDb(async (db) => {
		await db.insert(users).values(testUsers)
		await db.insert(teams).values(testTeams)
		await db.insert(projects).values(testProjects)
		await db.insert(deployments).values(testDeployments)
	})

	test('can count deployments by status', async ({ db }) => {
		const statusCounts = await db
			.select({
				status: deployments.status,
				count: count(),
			})
			.from(deployments)
			.groupBy(deployments.status)

		const countMap = Object.fromEntries(
			statusCounts.map((s) => [s.status, s.count]),
		)

		expect(countMap['ready']).toBe(2)
		expect(countMap['building']).toBe(1)
		expect(countMap['failed']).toBe(1)
	})

	test('can count projects per team', async ({ db }) => {
		const teamCounts = await db
			.select({
				teamId: projects.teamId,
				count: count(),
			})
			.from(projects)
			.groupBy(projects.teamId)

		const countMap = Object.fromEntries(
			teamCounts.map((t) => [t.teamId, t.count]),
		)

		expect(countMap['team-1']).toBe(2)
		expect(countMap['team-2']).toBe(1)
	})
})
