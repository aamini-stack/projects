CREATE TABLE `build_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`deployment_id` text NOT NULL,
	`timestamp` text NOT NULL,
	`level` text DEFAULT 'info' NOT NULL,
	`message` text NOT NULL,
	`source` text DEFAULT 'build' NOT NULL,
	FOREIGN KEY (`deployment_id`) REFERENCES `deployments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_build_logs_deployment` ON `build_logs` (`deployment_id`);--> statement-breakpoint
CREATE INDEX `idx_build_logs_timestamp` ON `build_logs` (`deployment_id`,`timestamp`);--> statement-breakpoint
CREATE TABLE `clusters` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`api_endpoint` text NOT NULL,
	`kubeconfig_encrypted` text,
	`region` text,
	`provider` text,
	`status` text DEFAULT 'active' NOT NULL,
	`kubernetes_version` text,
	`total_cpu_cores` integer,
	`total_memory_gb` integer,
	`max_pods` integer,
	`is_default` integer DEFAULT false,
	`last_health_check_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clusters_slug_unique` ON `clusters` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_clusters_slug` ON `clusters` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_clusters_status` ON `clusters` (`status`);--> statement-breakpoint
CREATE TABLE `configuration_history` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`changed_by_user_id` text,
	`changed_via` text DEFAULT 'ui' NOT NULL,
	`previous_value` text,
	`new_value` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`changed_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_config_history_project` ON `configuration_history` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_config_history_entity` ON `configuration_history` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_config_history_created` ON `configuration_history` (`created_at`);--> statement-breakpoint
CREATE TABLE `deployments` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`environment` text NOT NULL,
	`status` text NOT NULL,
	`commit_sha` text NOT NULL,
	`commit_message` text,
	`commit_author_name` text,
	`commit_author_email` text,
	`commit_author_avatar` text,
	`branch` text NOT NULL,
	`pull_request_number` integer,
	`pull_request_title` text,
	`triggered_by` text NOT NULL,
	`triggered_by_user_id` text,
	`build_started_at` text,
	`build_finished_at` text,
	`deploy_started_at` text,
	`ready_at` text,
	`artifact_url` text,
	`artifact_size_bytes` integer,
	`error_message` text,
	`error_code` text,
	`rollback_from_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`triggered_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_deployments_project` ON `deployments` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_deployments_project_env` ON `deployments` (`project_id`,`environment`);--> statement-breakpoint
CREATE INDEX `idx_deployments_status` ON `deployments` (`status`);--> statement-breakpoint
CREATE INDEX `idx_deployments_branch` ON `deployments` (`project_id`,`branch`);--> statement-breakpoint
CREATE INDEX `idx_deployments_created` ON `deployments` (`created_at`);--> statement-breakpoint
CREATE TABLE `domains` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`domain` text NOT NULL,
	`type` text NOT NULL,
	`environment` text DEFAULT 'production' NOT NULL,
	`branch_pattern` text,
	`ssl_status` text DEFAULT 'pending' NOT NULL,
	`ssl_expires_at` text,
	`dns_status` text DEFAULT 'pending' NOT NULL,
	`dns_verified_at` text,
	`dns_verification_value` text,
	`is_primary` integer DEFAULT false,
	`redirect_to_primary` integer DEFAULT false,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `domains_domain_unique` ON `domains` (`domain`);--> statement-breakpoint
CREATE INDEX `idx_domains_project` ON `domains` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_domains_domain` ON `domains` (`domain`);--> statement-breakpoint
CREATE TABLE `environment_variables` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`key` text NOT NULL,
	`value_encrypted` text NOT NULL,
	`target` text DEFAULT '["production","preview","development"]',
	`type` text DEFAULT 'encrypted' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_env_vars_project` ON `environment_variables` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_env_vars_key` ON `environment_variables` (`project_id`,`key`);--> statement-breakpoint
CREATE TABLE `iac_exports` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`format` text NOT NULL,
	`exported_by_user_id` text,
	`content_hash` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exported_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_iac_exports_project` ON `iac_exports` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_iac_exports_format` ON `iac_exports` (`project_id`,`format`);--> statement-breakpoint
CREATE TABLE `namespaces` (
	`id` text PRIMARY KEY NOT NULL,
	`cluster_id` text NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'creating' NOT NULL,
	`resource_quota_cpu` text DEFAULT '1000m',
	`resource_quota_memory` text DEFAULT '2Gi',
	`resource_limit_cpu` text DEFAULT '500m',
	`resource_limit_memory` text DEFAULT '1Gi',
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`cluster_id`) REFERENCES `clusters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_namespaces_cluster` ON `namespaces` (`cluster_id`);--> statement-breakpoint
CREATE INDEX `idx_namespaces_project` ON `namespaces` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_namespaces_cluster_name` ON `namespaces` (`cluster_id`,`name`);--> statement-breakpoint
CREATE TABLE `oauth_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`access_token_encrypted` text NOT NULL,
	`refresh_token_encrypted` text,
	`token_type` text DEFAULT 'bearer',
	`scope` text,
	`expires_at` text,
	`provider_account_id` text NOT NULL,
	`provider_username` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_oauth_user` ON `oauth_tokens` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_oauth_user_provider` ON `oauth_tokens` (`user_id`,`provider`);--> statement-breakpoint
CREATE TABLE `preview_environments` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`branch` text NOT NULL,
	`pull_request_number` integer,
	`pull_request_url` text,
	`current_deployment_id` text,
	`url` text,
	`status` text DEFAULT 'active' NOT NULL,
	`last_activity_at` text DEFAULT (datetime('now')) NOT NULL,
	`sleep_after_minutes` integer DEFAULT 60,
	`auto_delete_after_days` integer DEFAULT 7,
	`scheduled_deletion_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`current_deployment_id`) REFERENCES `deployments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_preview_project` ON `preview_environments` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_preview_branch` ON `preview_environments` (`project_id`,`branch`);--> statement-breakpoint
CREATE INDEX `idx_preview_status` ON `preview_environments` (`status`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`repository_url` text NOT NULL,
	`repository_id` text NOT NULL,
	`repository_owner` text NOT NULL,
	`repository_name` text NOT NULL,
	`default_branch` text DEFAULT 'main' NOT NULL,
	`production_branch` text DEFAULT 'main' NOT NULL,
	`framework` text,
	`framework_detected` integer DEFAULT true,
	`build_command` text,
	`install_command` text DEFAULT 'npm install',
	`output_directory` text,
	`root_directory` text DEFAULT '/',
	`node_version` text DEFAULT '20',
	`auto_deploy` integer DEFAULT true,
	`webhook_secret` text NOT NULL,
	`webhook_id` text,
	`current_production_deployment_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_projects_team` ON `projects` (`team_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_projects_team_slug` ON `projects` (`team_id`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_projects_repo` ON `projects` (`repository_id`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`invited_by` text,
	`joined_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_team_members_team` ON `team_members` (`team_id`);--> statement-breakpoint
CREATE INDEX `idx_team_members_user` ON `team_members` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_team_members_unique` ON `team_members` (`team_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`avatar_url` text,
	`billing_email` text,
	`plan` text DEFAULT 'free' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_slug_unique` ON `teams` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_teams_slug` ON `teams` (`slug`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`avatar_url` text,
	`github_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_github_id_unique` ON `users` (`github_id`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_github_id` ON `users` (`github_id`);--> statement-breakpoint
CREATE TABLE `webhook_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text,
	`delivery_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload` text NOT NULL,
	`signature_valid` integer NOT NULL,
	`processing_status` text DEFAULT 'pending' NOT NULL,
	`deployment_id` text,
	`error_message` text,
	`processed_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`deployment_id`) REFERENCES `deployments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `webhook_deliveries_delivery_id_unique` ON `webhook_deliveries` (`delivery_id`);--> statement-breakpoint
CREATE INDEX `idx_webhook_project` ON `webhook_deliveries` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_webhook_delivery_id` ON `webhook_deliveries` (`delivery_id`);--> statement-breakpoint
CREATE INDEX `idx_webhook_status` ON `webhook_deliveries` (`processing_status`);