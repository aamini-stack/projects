import { relations, sql } from 'drizzle-orm'
import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from 'drizzle-orm/sqlite-core'

// =============================================================================
// Helper for default timestamps
// =============================================================================
const timestamps = {
	createdAt: text('created_at')
		.default(sql`(datetime('now'))`)
		.notNull(),
	updatedAt: text('updated_at')
		.default(sql`(datetime('now'))`)
		.notNull(),
}

// =============================================================================
// Users & Authentication
// =============================================================================
export const users = sqliteTable(
	'users',
	{
		id: text('id').primaryKey(),
		email: text('email').unique().notNull(),
		name: text('name').notNull(),
		avatarUrl: text('avatar_url'),
		githubId: text('github_id').unique(),
		...timestamps,
		deletedAt: text('deleted_at'),
	},
	(table) => [
		index('idx_users_email').on(table.email),
		index('idx_users_github_id').on(table.githubId),
	],
)

export const usersRelations = relations(users, ({ many }) => ({
	teamMembers: many(teamMembers),
	oauthTokens: many(oauthTokens),
	triggeredDeployments: many(deployments, { relationName: 'triggeredBy' }),
	configChanges: many(configurationHistory, { relationName: 'changedBy' }),
}))

// =============================================================================
// Teams
// =============================================================================
export const teams = sqliteTable(
	'teams',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		slug: text('slug').unique().notNull(),
		avatarUrl: text('avatar_url'),
		billingEmail: text('billing_email'),
		plan: text('plan', { enum: ['free', 'pro', 'enterprise'] })
			.default('free')
			.notNull(),
		...timestamps,
		deletedAt: text('deleted_at'),
	},
	(table) => [index('idx_teams_slug').on(table.slug)],
)

export const teamsRelations = relations(teams, ({ many }) => ({
	members: many(teamMembers),
	projects: many(projects),
}))

// =============================================================================
// Team Members (join table)
// =============================================================================
export const teamMembers = sqliteTable(
	'team_members',
	{
		id: text('id').primaryKey(),
		teamId: text('team_id')
			.references(() => teams.id, { onDelete: 'cascade' })
			.notNull(),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		role: text('role', {
			enum: ['owner', 'admin', 'member', 'viewer'],
		}).notNull(),
		invitedBy: text('invited_by').references(() => users.id),
		joinedAt: text('joined_at')
			.default(sql`(datetime('now'))`)
			.notNull(),
	},
	(table) => [
		index('idx_team_members_team').on(table.teamId),
		index('idx_team_members_user').on(table.userId),
		uniqueIndex('idx_team_members_unique').on(table.teamId, table.userId),
	],
)

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
	team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
	user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
	inviter: one(users, {
		fields: [teamMembers.invitedBy],
		references: [users.id],
	}),
}))

// =============================================================================
// OAuth Tokens
// =============================================================================
export const oauthTokens = sqliteTable(
	'oauth_tokens',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		provider: text('provider', {
			enum: ['github', 'gitlab', 'bitbucket'],
		}).notNull(),
		accessTokenEncrypted: text('access_token_encrypted').notNull(),
		refreshTokenEncrypted: text('refresh_token_encrypted'),
		tokenType: text('token_type').default('bearer'),
		scope: text('scope'),
		expiresAt: text('expires_at'),
		providerAccountId: text('provider_account_id').notNull(),
		providerUsername: text('provider_username'),
		...timestamps,
	},
	(table) => [
		index('idx_oauth_user').on(table.userId),
		uniqueIndex('idx_oauth_user_provider').on(table.userId, table.provider),
	],
)

export const oauthTokensRelations = relations(oauthTokens, ({ one }) => ({
	user: one(users, { fields: [oauthTokens.userId], references: [users.id] }),
}))

// =============================================================================
// Projects
// =============================================================================
export const projects = sqliteTable(
	'projects',
	{
		id: text('id').primaryKey(),
		teamId: text('team_id')
			.references(() => teams.id, { onDelete: 'cascade' })
			.notNull(),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		description: text('description'),
		repositoryUrl: text('repository_url').notNull(),
		repositoryId: text('repository_id').notNull(),
		repositoryOwner: text('repository_owner').notNull(),
		repositoryName: text('repository_name').notNull(),
		defaultBranch: text('default_branch').default('main').notNull(),
		productionBranch: text('production_branch').default('main').notNull(),
		framework: text('framework', {
			enum: ['nextjs', 'react', 'vite', 'remix', 'astro', 'static', 'custom'],
		}),
		frameworkDetected: integer('framework_detected', {
			mode: 'boolean',
		}).default(true),
		buildCommand: text('build_command'),
		installCommand: text('install_command').default('npm install'),
		outputDirectory: text('output_directory'),
		rootDirectory: text('root_directory').default('/'),
		nodeVersion: text('node_version').default('20'),
		autoDeploy: integer('auto_deploy', { mode: 'boolean' }).default(true),
		webhookSecret: text('webhook_secret').notNull(),
		webhookId: text('webhook_id'),
		currentProductionDeploymentId: text('current_production_deployment_id'),
		...timestamps,
		deletedAt: text('deleted_at'),
	},
	(table) => [
		index('idx_projects_team').on(table.teamId),
		uniqueIndex('idx_projects_team_slug').on(table.teamId, table.slug),
		index('idx_projects_repo').on(table.repositoryId),
	],
)

export const projectsRelations = relations(projects, ({ one, many }) => ({
	team: one(teams, { fields: [projects.teamId], references: [teams.id] }),
	currentDeployment: one(deployments, {
		fields: [projects.currentProductionDeploymentId],
		references: [deployments.id],
		relationName: 'currentProduction',
	}),
	deployments: many(deployments),
	domains: many(domains),
	environmentVariables: many(environmentVariables),
	previewEnvironments: many(previewEnvironments),
	namespaces: many(namespaces),
	configurationHistory: many(configurationHistory),
	webhookDeliveries: many(webhookDeliveries),
	iacExports: many(iacExports),
}))

// =============================================================================
// Deployments
// =============================================================================
export const deployments = sqliteTable(
	'deployments',
	{
		id: text('id').primaryKey(),
		projectId: text('project_id')
			.references(() => projects.id, { onDelete: 'cascade' })
			.notNull(),
		environment: text('environment', {
			enum: ['production', 'preview'],
		}).notNull(),
		status: text('status', {
			enum: ['queued', 'building', 'deploying', 'ready', 'failed', 'canceled'],
		}).notNull(),
		commitSha: text('commit_sha').notNull(),
		commitMessage: text('commit_message'),
		commitAuthorName: text('commit_author_name'),
		commitAuthorEmail: text('commit_author_email'),
		commitAuthorAvatar: text('commit_author_avatar'),
		branch: text('branch').notNull(),
		pullRequestNumber: integer('pull_request_number'),
		pullRequestTitle: text('pull_request_title'),
		triggeredBy: text('triggered_by', {
			enum: ['push', 'pull_request', 'manual', 'rollback', 'redeploy'],
		}).notNull(),
		triggeredByUserId: text('triggered_by_user_id').references(() => users.id),
		buildStartedAt: text('build_started_at'),
		buildFinishedAt: text('build_finished_at'),
		deployStartedAt: text('deploy_started_at'),
		readyAt: text('ready_at'),
		artifactUrl: text('artifact_url'),
		artifactSizeBytes: integer('artifact_size_bytes'),
		errorMessage: text('error_message'),
		errorCode: text('error_code'),
		rollbackFromId: text('rollback_from_id'),
		...timestamps,
	},
	(table) => [
		index('idx_deployments_project').on(table.projectId),
		index('idx_deployments_project_env').on(table.projectId, table.environment),
		index('idx_deployments_status').on(table.status),
		index('idx_deployments_branch').on(table.projectId, table.branch),
		index('idx_deployments_created').on(table.createdAt),
	],
)

export const deploymentsRelations = relations(deployments, ({ one, many }) => ({
	project: one(projects, {
		fields: [deployments.projectId],
		references: [projects.id],
	}),
	triggeredByUser: one(users, {
		fields: [deployments.triggeredByUserId],
		references: [users.id],
		relationName: 'triggeredBy',
	}),
	rollbackFrom: one(deployments, {
		fields: [deployments.rollbackFromId],
		references: [deployments.id],
		relationName: 'rollbacks',
	}),
	buildLogs: many(buildLogs),
}))

// =============================================================================
// Build Logs
// =============================================================================
export const buildLogs = sqliteTable(
	'build_logs',
	{
		id: text('id').primaryKey(),
		deploymentId: text('deployment_id')
			.references(() => deployments.id, { onDelete: 'cascade' })
			.notNull(),
		timestamp: text('timestamp').notNull(),
		level: text('level', { enum: ['debug', 'info', 'warn', 'error'] })
			.default('info')
			.notNull(),
		message: text('message').notNull(),
		source: text('source', { enum: ['system', 'build', 'deploy'] })
			.default('build')
			.notNull(),
	},
	(table) => [
		index('idx_build_logs_deployment').on(table.deploymentId),
		index('idx_build_logs_timestamp').on(table.deploymentId, table.timestamp),
	],
)

export const buildLogsRelations = relations(buildLogs, ({ one }) => ({
	deployment: one(deployments, {
		fields: [buildLogs.deploymentId],
		references: [deployments.id],
	}),
}))

// =============================================================================
// Environment Variables
// =============================================================================
export const environmentVariables = sqliteTable(
	'environment_variables',
	{
		id: text('id').primaryKey(),
		projectId: text('project_id')
			.references(() => projects.id, { onDelete: 'cascade' })
			.notNull(),
		key: text('key').notNull(),
		valueEncrypted: text('value_encrypted').notNull(),
		target: text('target', { mode: 'json' })
			.$type<('production' | 'preview' | 'development')[]>()
			.default(['production', 'preview', 'development']),
		type: text('type', { enum: ['encrypted', 'plain', 'system'] })
			.default('encrypted')
			.notNull(),
		...timestamps,
	},
	(table) => [
		index('idx_env_vars_project').on(table.projectId),
		uniqueIndex('idx_env_vars_key').on(table.projectId, table.key),
	],
)

export const environmentVariablesRelations = relations(
	environmentVariables,
	({ one }) => ({
		project: one(projects, {
			fields: [environmentVariables.projectId],
			references: [projects.id],
		}),
	}),
)

// =============================================================================
// Domains
// =============================================================================
export const domains = sqliteTable(
	'domains',
	{
		id: text('id').primaryKey(),
		projectId: text('project_id')
			.references(() => projects.id, { onDelete: 'cascade' })
			.notNull(),
		domain: text('domain').unique().notNull(),
		type: text('type', { enum: ['auto', 'custom'] }).notNull(),
		environment: text('environment', { enum: ['production', 'preview'] })
			.default('production')
			.notNull(),
		branchPattern: text('branch_pattern'),
		sslStatus: text('ssl_status', {
			enum: ['pending', 'provisioning', 'active', 'failed'],
		})
			.default('pending')
			.notNull(),
		sslExpiresAt: text('ssl_expires_at'),
		dnsStatus: text('dns_status', {
			enum: ['pending', 'verifying', 'verified', 'failed'],
		})
			.default('pending')
			.notNull(),
		dnsVerifiedAt: text('dns_verified_at'),
		dnsVerificationValue: text('dns_verification_value'),
		isPrimary: integer('is_primary', { mode: 'boolean' }).default(false),
		redirectToPrimary: integer('redirect_to_primary', {
			mode: 'boolean',
		}).default(false),
		...timestamps,
	},
	(table) => [
		index('idx_domains_project').on(table.projectId),
		index('idx_domains_domain').on(table.domain),
	],
)

export const domainsRelations = relations(domains, ({ one }) => ({
	project: one(projects, {
		fields: [domains.projectId],
		references: [projects.id],
	}),
}))

// =============================================================================
// Preview Environments
// =============================================================================
export const previewEnvironments = sqliteTable(
	'preview_environments',
	{
		id: text('id').primaryKey(),
		projectId: text('project_id')
			.references(() => projects.id, { onDelete: 'cascade' })
			.notNull(),
		branch: text('branch').notNull(),
		pullRequestNumber: integer('pull_request_number'),
		pullRequestUrl: text('pull_request_url'),
		currentDeploymentId: text('current_deployment_id').references(
			() => deployments.id,
		),
		url: text('url'),
		status: text('status', {
			enum: ['active', 'sleeping', 'waking', 'deleted'],
		})
			.default('active')
			.notNull(),
		lastActivityAt: text('last_activity_at')
			.default(sql`(datetime('now'))`)
			.notNull(),
		sleepAfterMinutes: integer('sleep_after_minutes').default(60),
		autoDeleteAfterDays: integer('auto_delete_after_days').default(7),
		scheduledDeletionAt: text('scheduled_deletion_at'),
		...timestamps,
	},
	(table) => [
		index('idx_preview_project').on(table.projectId),
		uniqueIndex('idx_preview_branch').on(table.projectId, table.branch),
		index('idx_preview_status').on(table.status),
	],
)

export const previewEnvironmentsRelations = relations(
	previewEnvironments,
	({ one }) => ({
		project: one(projects, {
			fields: [previewEnvironments.projectId],
			references: [projects.id],
		}),
		currentDeployment: one(deployments, {
			fields: [previewEnvironments.currentDeploymentId],
			references: [deployments.id],
		}),
	}),
)

// =============================================================================
// Kubernetes Clusters
// =============================================================================
export const clusters = sqliteTable(
	'clusters',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		slug: text('slug').unique().notNull(),
		apiEndpoint: text('api_endpoint').notNull(),
		kubeconfigEncrypted: text('kubeconfig_encrypted'),
		region: text('region'),
		provider: text('provider', {
			enum: ['aws', 'gcp', 'azure', 'digitalocean', 'linode', 'self-hosted'],
		}),
		status: text('status', {
			enum: ['active', 'degraded', 'unreachable', 'maintenance'],
		})
			.default('active')
			.notNull(),
		kubernetesVersion: text('kubernetes_version'),
		totalCpuCores: integer('total_cpu_cores'),
		totalMemoryGb: integer('total_memory_gb'),
		maxPods: integer('max_pods'),
		isDefault: integer('is_default', { mode: 'boolean' }).default(false),
		lastHealthCheckAt: text('last_health_check_at'),
		...timestamps,
	},
	(table) => [
		index('idx_clusters_slug').on(table.slug),
		index('idx_clusters_status').on(table.status),
	],
)

export const clustersRelations = relations(clusters, ({ many }) => ({
	namespaces: many(namespaces),
}))

// =============================================================================
// Kubernetes Namespaces
// =============================================================================
export const namespaces = sqliteTable(
	'namespaces',
	{
		id: text('id').primaryKey(),
		clusterId: text('cluster_id')
			.references(() => clusters.id, { onDelete: 'cascade' })
			.notNull(),
		projectId: text('project_id')
			.references(() => projects.id, { onDelete: 'cascade' })
			.notNull(),
		name: text('name').notNull(),
		status: text('status', {
			enum: ['creating', 'active', 'terminating', 'failed'],
		})
			.default('creating')
			.notNull(),
		resourceQuotaCpu: text('resource_quota_cpu').default('1000m'),
		resourceQuotaMemory: text('resource_quota_memory').default('2Gi'),
		resourceLimitCpu: text('resource_limit_cpu').default('500m'),
		resourceLimitMemory: text('resource_limit_memory').default('1Gi'),
		...timestamps,
	},
	(table) => [
		index('idx_namespaces_cluster').on(table.clusterId),
		index('idx_namespaces_project').on(table.projectId),
		uniqueIndex('idx_namespaces_cluster_name').on(table.clusterId, table.name),
	],
)

export const namespacesRelations = relations(namespaces, ({ one }) => ({
	cluster: one(clusters, {
		fields: [namespaces.clusterId],
		references: [clusters.id],
	}),
	project: one(projects, {
		fields: [namespaces.projectId],
		references: [projects.id],
	}),
}))

// =============================================================================
// Configuration History (Audit Trail)
// =============================================================================
export const configurationHistory = sqliteTable(
	'configuration_history',
	{
		id: text('id').primaryKey(),
		projectId: text('project_id')
			.references(() => projects.id, { onDelete: 'cascade' })
			.notNull(),
		entityType: text('entity_type', {
			enum: ['project', 'environment_variable', 'domain', 'deployment'],
		}).notNull(),
		entityId: text('entity_id').notNull(),
		action: text('action', { enum: ['create', 'update', 'delete'] }).notNull(),
		changedByUserId: text('changed_by_user_id').references(() => users.id),
		changedVia: text('changed_via', {
			enum: ['ui', 'api', 'terraform', 'pulumi', 'cli'],
		})
			.default('ui')
			.notNull(),
		previousValue: text('previous_value', { mode: 'json' }),
		newValue: text('new_value', { mode: 'json' }),
		createdAt: text('created_at')
			.default(sql`(datetime('now'))`)
			.notNull(),
	},
	(table) => [
		index('idx_config_history_project').on(table.projectId),
		index('idx_config_history_entity').on(table.entityType, table.entityId),
		index('idx_config_history_created').on(table.createdAt),
	],
)

export const configurationHistoryRelations = relations(
	configurationHistory,
	({ one }) => ({
		project: one(projects, {
			fields: [configurationHistory.projectId],
			references: [projects.id],
		}),
		changedByUser: one(users, {
			fields: [configurationHistory.changedByUserId],
			references: [users.id],
			relationName: 'changedBy',
		}),
	}),
)

// =============================================================================
// Webhook Deliveries
// =============================================================================
export const webhookDeliveries = sqliteTable(
	'webhook_deliveries',
	{
		id: text('id').primaryKey(),
		projectId: text('project_id').references(() => projects.id, {
			onDelete: 'set null',
		}),
		deliveryId: text('delivery_id').unique().notNull(),
		eventType: text('event_type').notNull(),
		payload: text('payload', { mode: 'json' }).notNull(),
		signatureValid: integer('signature_valid', { mode: 'boolean' }).notNull(),
		processingStatus: text('processing_status', {
			enum: ['pending', 'processing', 'completed', 'failed', 'ignored'],
		})
			.default('pending')
			.notNull(),
		deploymentId: text('deployment_id').references(() => deployments.id),
		errorMessage: text('error_message'),
		processedAt: text('processed_at'),
		createdAt: text('created_at')
			.default(sql`(datetime('now'))`)
			.notNull(),
	},
	(table) => [
		index('idx_webhook_project').on(table.projectId),
		index('idx_webhook_delivery_id').on(table.deliveryId),
		index('idx_webhook_status').on(table.processingStatus),
	],
)

export const webhookDeliveriesRelations = relations(
	webhookDeliveries,
	({ one }) => ({
		project: one(projects, {
			fields: [webhookDeliveries.projectId],
			references: [projects.id],
		}),
		deployment: one(deployments, {
			fields: [webhookDeliveries.deploymentId],
			references: [deployments.id],
		}),
	}),
)

// =============================================================================
// IaC Exports
// =============================================================================
export const iacExports = sqliteTable(
	'iac_exports',
	{
		id: text('id').primaryKey(),
		projectId: text('project_id')
			.references(() => projects.id, { onDelete: 'cascade' })
			.notNull(),
		format: text('format', {
			enum: ['json', 'terraform', 'pulumi_ts', 'pulumi_py', 'shell'],
		}).notNull(),
		exportedByUserId: text('exported_by_user_id').references(() => users.id),
		contentHash: text('content_hash').notNull(),
		content: text('content').notNull(),
		createdAt: text('created_at')
			.default(sql`(datetime('now'))`)
			.notNull(),
	},
	(table) => [
		index('idx_iac_exports_project').on(table.projectId),
		index('idx_iac_exports_format').on(table.projectId, table.format),
	],
)

export const iacExportsRelations = relations(iacExports, ({ one }) => ({
	project: one(projects, {
		fields: [iacExports.projectId],
		references: [projects.id],
	}),
	exportedByUser: one(users, {
		fields: [iacExports.exportedByUserId],
		references: [users.id],
	}),
}))

// =============================================================================
// Type Exports (for convenience)
// =============================================================================
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Team = typeof teams.$inferSelect
export type NewTeam = typeof teams.$inferInsert
export type TeamMember = typeof teamMembers.$inferSelect
export type NewTeamMember = typeof teamMembers.$inferInsert
export type OAuthToken = typeof oauthTokens.$inferSelect
export type NewOAuthToken = typeof oauthTokens.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type Deployment = typeof deployments.$inferSelect
export type NewDeployment = typeof deployments.$inferInsert
export type BuildLog = typeof buildLogs.$inferSelect
export type NewBuildLog = typeof buildLogs.$inferInsert
export type EnvironmentVariable = typeof environmentVariables.$inferSelect
export type NewEnvironmentVariable = typeof environmentVariables.$inferInsert
export type Domain = typeof domains.$inferSelect
export type NewDomain = typeof domains.$inferInsert
export type PreviewEnvironment = typeof previewEnvironments.$inferSelect
export type NewPreviewEnvironment = typeof previewEnvironments.$inferInsert
export type Cluster = typeof clusters.$inferSelect
export type NewCluster = typeof clusters.$inferInsert
export type Namespace = typeof namespaces.$inferSelect
export type NewNamespace = typeof namespaces.$inferInsert
export type ConfigurationHistoryRecord =
	typeof configurationHistory.$inferSelect
export type NewConfigurationHistoryRecord =
	typeof configurationHistory.$inferInsert
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert
export type IaCExport = typeof iacExports.$inferSelect
export type NewIaCExport = typeof iacExports.$inferInsert
