import type {
	NewBuildLog,
	NewCluster,
	NewDeployment,
	NewDomain,
	NewEnvironmentVariable,
	NewNamespace,
	NewPreviewEnvironment,
	NewProject,
	NewTeam,
	NewTeamMember,
	NewUser,
} from '@/db/schema'

// =============================================================================
// Users
// =============================================================================
export const testUsers: NewUser[] = [
	{
		id: 'user-1',
		email: 'alice@example.com',
		name: 'Alice Developer',
		avatarUrl: 'https://github.com/alice.png',
		githubId: 'gh-alice-123',
	},
	{
		id: 'user-2',
		email: 'bob@example.com',
		name: 'Bob Engineer',
		avatarUrl: 'https://github.com/bob.png',
		githubId: 'gh-bob-456',
	},
	{
		id: 'user-3',
		email: 'charlie@example.com',
		name: 'Charlie Admin',
		avatarUrl: null,
		githubId: 'gh-charlie-789',
	},
]

// =============================================================================
// Teams
// =============================================================================
export const testTeams: NewTeam[] = [
	{
		id: 'team-1',
		name: 'Acme Corp',
		slug: 'acme-corp',
		avatarUrl: 'https://acme.com/logo.png',
		billingEmail: 'billing@acme.com',
		plan: 'pro',
	},
	{
		id: 'team-2',
		name: 'Startup Inc',
		slug: 'startup-inc',
		avatarUrl: null,
		billingEmail: null,
		plan: 'free',
	},
]

// =============================================================================
// Team Members
// =============================================================================
export const testTeamMembers: NewTeamMember[] = [
	{
		id: 'tm-1',
		teamId: 'team-1',
		userId: 'user-1',
		role: 'owner',
		invitedBy: null,
	},
	{
		id: 'tm-2',
		teamId: 'team-1',
		userId: 'user-2',
		role: 'member',
		invitedBy: 'user-1',
	},
	{
		id: 'tm-3',
		teamId: 'team-2',
		userId: 'user-3',
		role: 'owner',
		invitedBy: null,
	},
]

// =============================================================================
// Projects
// =============================================================================
export const testProjects: NewProject[] = [
	{
		id: 'proj-1',
		teamId: 'team-1',
		name: 'E-commerce Frontend',
		slug: 'ecommerce-frontend',
		description: 'Main storefront application',
		repositoryUrl: 'https://github.com/acme/ecommerce-frontend',
		repositoryId: 'repo-123',
		repositoryOwner: 'acme',
		repositoryName: 'ecommerce-frontend',
		defaultBranch: 'main',
		productionBranch: 'main',
		framework: 'nextjs',
		frameworkDetected: true,
		buildCommand: 'npm run build',
		installCommand: 'npm install',
		outputDirectory: '.next',
		rootDirectory: '/',
		nodeVersion: '20',
		autoDeploy: true,
		webhookSecret: 'whsec-proj1-secret',
	},
	{
		id: 'proj-2',
		teamId: 'team-1',
		name: 'API Backend',
		slug: 'api-backend',
		description: 'REST API service',
		repositoryUrl: 'https://github.com/acme/api-backend',
		repositoryId: 'repo-456',
		repositoryOwner: 'acme',
		repositoryName: 'api-backend',
		defaultBranch: 'main',
		productionBranch: 'main',
		framework: 'custom',
		frameworkDetected: false,
		buildCommand: 'npm run build',
		installCommand: 'npm ci',
		outputDirectory: 'dist',
		rootDirectory: '/',
		nodeVersion: '20',
		autoDeploy: true,
		webhookSecret: 'whsec-proj2-secret',
	},
	{
		id: 'proj-3',
		teamId: 'team-2',
		name: 'Landing Page',
		slug: 'landing-page',
		description: 'Marketing landing page',
		repositoryUrl: 'https://github.com/startup/landing',
		repositoryId: 'repo-789',
		repositoryOwner: 'startup',
		repositoryName: 'landing',
		defaultBranch: 'main',
		productionBranch: 'main',
		framework: 'vite',
		frameworkDetected: true,
		buildCommand: 'npm run build',
		installCommand: 'npm install',
		outputDirectory: 'dist',
		rootDirectory: '/',
		nodeVersion: '18',
		autoDeploy: false,
		webhookSecret: 'whsec-proj3-secret',
	},
]

// =============================================================================
// Deployments
// =============================================================================
export const testDeployments: NewDeployment[] = [
	{
		id: 'deploy-1',
		projectId: 'proj-1',
		environment: 'production',
		status: 'ready',
		commitSha: 'abc123def456',
		commitMessage: 'feat: add checkout flow',
		commitAuthorName: 'Alice Developer',
		commitAuthorEmail: 'alice@example.com',
		branch: 'main',
		triggeredBy: 'push',
		triggeredByUserId: 'user-1',
		buildStartedAt: '2024-01-15T10:00:00Z',
		buildFinishedAt: '2024-01-15T10:02:30Z',
		deployStartedAt: '2024-01-15T10:02:31Z',
		readyAt: '2024-01-15T10:03:00Z',
		artifactUrl: 's3://artifacts/deploy-1.tar.gz',
		artifactSizeBytes: 15_000_000,
	},
	{
		id: 'deploy-2',
		projectId: 'proj-1',
		environment: 'preview',
		status: 'building',
		commitSha: 'xyz789abc',
		commitMessage: 'fix: cart total calculation',
		commitAuthorName: 'Bob Engineer',
		commitAuthorEmail: 'bob@example.com',
		branch: 'feature/cart-fix',
		pullRequestNumber: 42,
		pullRequestTitle: 'Fix cart total calculation',
		triggeredBy: 'pull_request',
		triggeredByUserId: 'user-2',
		buildStartedAt: '2024-01-15T11:00:00Z',
	},
	{
		id: 'deploy-3',
		projectId: 'proj-1',
		environment: 'preview',
		status: 'failed',
		commitSha: 'failed123',
		commitMessage: 'chore: update dependencies',
		commitAuthorName: 'Alice Developer',
		commitAuthorEmail: 'alice@example.com',
		branch: 'feature/deps-update',
		triggeredBy: 'push',
		triggeredByUserId: 'user-1',
		buildStartedAt: '2024-01-14T09:00:00Z',
		buildFinishedAt: '2024-01-14T09:01:30Z',
		errorMessage: 'Build failed: Module not found',
		errorCode: 'MODULE_NOT_FOUND',
	},
	{
		id: 'deploy-4',
		projectId: 'proj-2',
		environment: 'production',
		status: 'ready',
		commitSha: 'api789xyz',
		commitMessage: 'feat: add rate limiting',
		commitAuthorName: 'Bob Engineer',
		commitAuthorEmail: 'bob@example.com',
		branch: 'main',
		triggeredBy: 'push',
		triggeredByUserId: 'user-2',
		buildStartedAt: '2024-01-15T08:00:00Z',
		buildFinishedAt: '2024-01-15T08:03:00Z',
		deployStartedAt: '2024-01-15T08:03:01Z',
		readyAt: '2024-01-15T08:04:00Z',
		artifactUrl: 's3://artifacts/deploy-4.tar.gz',
		artifactSizeBytes: 8_000_000,
	},
]

// =============================================================================
// Domains
// =============================================================================
export const testDomains: NewDomain[] = [
	{
		id: 'domain-1',
		projectId: 'proj-1',
		domain: 'ecommerce.acme.com',
		type: 'custom',
		environment: 'production',
		sslStatus: 'active',
		dnsStatus: 'verified',
		dnsVerifiedAt: '2024-01-01T00:00:00Z',
		isPrimary: true,
		redirectToPrimary: false,
	},
	{
		id: 'domain-2',
		projectId: 'proj-1',
		domain: 'ecommerce-frontend.platform.dev',
		type: 'auto',
		environment: 'production',
		sslStatus: 'active',
		dnsStatus: 'verified',
		isPrimary: false,
		redirectToPrimary: true,
	},
	{
		id: 'domain-3',
		projectId: 'proj-1',
		domain: 'feature-cart-fix.ecommerce-frontend.platform.dev',
		type: 'auto',
		environment: 'preview',
		branchPattern: 'feature/cart-fix',
		sslStatus: 'active',
		dnsStatus: 'verified',
		isPrimary: false,
	},
]

// =============================================================================
// Environment Variables
// =============================================================================
export const testEnvVars: NewEnvironmentVariable[] = [
	{
		id: 'env-1',
		projectId: 'proj-1',
		key: 'DATABASE_URL',
		valueEncrypted: 'encrypted:postgres://...',
		target: ['production', 'preview'],
		type: 'encrypted',
	},
	{
		id: 'env-2',
		projectId: 'proj-1',
		key: 'API_KEY',
		valueEncrypted: 'encrypted:sk-...',
		target: ['production'],
		type: 'encrypted',
	},
	{
		id: 'env-3',
		projectId: 'proj-1',
		key: 'NODE_ENV',
		valueEncrypted: 'production',
		target: ['production', 'preview', 'development'],
		type: 'plain',
	},
]

// =============================================================================
// Preview Environments
// =============================================================================
export const testPreviewEnvironments: NewPreviewEnvironment[] = [
	{
		id: 'preview-1',
		projectId: 'proj-1',
		branch: 'feature/cart-fix',
		pullRequestNumber: 42,
		pullRequestUrl: 'https://github.com/acme/ecommerce-frontend/pull/42',
		currentDeploymentId: 'deploy-2',
		url: 'https://feature-cart-fix.ecommerce-frontend.platform.dev',
		status: 'active',
		sleepAfterMinutes: 60,
		autoDeleteAfterDays: 7,
	},
	{
		id: 'preview-2',
		projectId: 'proj-1',
		branch: 'feature/deps-update',
		currentDeploymentId: 'deploy-3',
		url: 'https://feature-deps-update.ecommerce-frontend.platform.dev',
		status: 'sleeping',
		sleepAfterMinutes: 60,
		autoDeleteAfterDays: 7,
	},
]

// =============================================================================
// Clusters
// =============================================================================
export const testClusters: NewCluster[] = [
	{
		id: 'cluster-1',
		name: 'US East Production',
		slug: 'us-east-prod',
		apiEndpoint: 'https://k8s.us-east.platform.dev:6443',
		kubeconfigEncrypted: 'encrypted:kubeconfig...',
		region: 'us-east-1',
		provider: 'aws',
		status: 'active',
		kubernetesVersion: '1.28.0',
		totalCpuCores: 96,
		totalMemoryGb: 384,
		maxPods: 1000,
		isDefault: true,
	},
	{
		id: 'cluster-2',
		name: 'EU West Preview',
		slug: 'eu-west-preview',
		apiEndpoint: 'https://k8s.eu-west.platform.dev:6443',
		kubeconfigEncrypted: 'encrypted:kubeconfig...',
		region: 'eu-west-1',
		provider: 'aws',
		status: 'active',
		kubernetesVersion: '1.28.0',
		totalCpuCores: 48,
		totalMemoryGb: 192,
		maxPods: 500,
		isDefault: false,
	},
]

// =============================================================================
// Namespaces
// =============================================================================
export const testNamespaces: NewNamespace[] = [
	{
		id: 'ns-1',
		clusterId: 'cluster-1',
		projectId: 'proj-1',
		name: 'acme-ecommerce-frontend',
		status: 'active',
		resourceQuotaCpu: '2000m',
		resourceQuotaMemory: '4Gi',
		resourceLimitCpu: '1000m',
		resourceLimitMemory: '2Gi',
	},
	{
		id: 'ns-2',
		clusterId: 'cluster-1',
		projectId: 'proj-2',
		name: 'acme-api-backend',
		status: 'active',
		resourceQuotaCpu: '4000m',
		resourceQuotaMemory: '8Gi',
		resourceLimitCpu: '2000m',
		resourceLimitMemory: '4Gi',
	},
]

// =============================================================================
// Build Logs
// =============================================================================
export const testBuildLogs: NewBuildLog[] = [
	{
		id: 'log-1',
		deploymentId: 'deploy-1',
		timestamp: '2024-01-15T10:00:00Z',
		level: 'info',
		message: 'Starting build...',
		source: 'system',
	},
	{
		id: 'log-2',
		deploymentId: 'deploy-1',
		timestamp: '2024-01-15T10:00:05Z',
		level: 'info',
		message: 'Installing dependencies...',
		source: 'build',
	},
	{
		id: 'log-3',
		deploymentId: 'deploy-1',
		timestamp: '2024-01-15T10:01:30Z',
		level: 'info',
		message: 'Running npm run build...',
		source: 'build',
	},
	{
		id: 'log-4',
		deploymentId: 'deploy-1',
		timestamp: '2024-01-15T10:02:30Z',
		level: 'info',
		message: 'Build completed successfully',
		source: 'system',
	},
	{
		id: 'log-5',
		deploymentId: 'deploy-3',
		timestamp: '2024-01-14T09:01:30Z',
		level: 'error',
		message: "Error: Cannot find module '@acme/missing-package'",
		source: 'build',
	},
]
