import { formatDistanceToNow } from '@/lib/utils'
import type { Deployment, Project } from '@/types'

const PROJECTS: Project[] = [
	{
		id: '1',
		name: 'nexus-dashboard',
		domain: 'dashboard.nexus.sh',
		status: 'ready',
		branch: 'main',
		commit: 'Update navigation layout',
		updatedAtTimestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
		updatedAt: '2m ago',
		author: 'aria',
		repo: 'aamini/nexus-dashboard',
	},
	{
		id: '2',
		name: 'api-gateway',
		domain: 'api.nexus.sh',
		status: 'building',
		branch: 'feat/rate-limiting',
		commit: 'Implement redis cache',
		updatedAtTimestamp: new Date(Date.now() - 15 * 1000).toISOString(),
		updatedAt: '15s ago',
		author: 'bot',
		repo: 'aamini/api-gateway',
	},
	{
		id: '3',
		name: 'docs',
		domain: 'docs.nexus.sh',
		status: 'ready',
		branch: 'main',
		commit: 'Fix typos in quickstart',
		updatedAtTimestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
		updatedAt: '1h ago',
		author: 'aria',
		repo: 'aamini/docs',
	},
	{
		id: '4',
		name: 'auth-service',
		domain: 'auth.nexus.sh',
		status: 'error',
		branch: 'fix/oauth-flow',
		commit: 'Refactor session handling',
		updatedAtTimestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
		updatedAt: '4h ago',
		author: 'aria',
		repo: 'aamini/auth-service',
	},
]

const DEPLOYMENTS: Deployment[] = [
	{
		id: 'd1',
		projectId: '1',
		projectName: 'nexus-dashboard',
		repo: 'aamini/nexus-dashboard',
		commitMessage: 'Update navigation layout',
		commitSha: 'a1b2c3d4',
		branch: 'main',
		timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
		time: '2m ago',
		author: 'aria',
		status: 'built',
		duration: '45s',
		env: 'production',
		isCurrent: true,
	},
	{
		id: 'd2',
		projectId: '2',
		projectName: 'api-gateway',
		repo: 'aamini/api-gateway',
		commitMessage: 'Implement redis cache',
		commitSha: 'e5f6g7h8',
		branch: 'feat/rate-limiting',
		timestamp: new Date(Date.now() - 15 * 1000).toISOString(),
		time: '15s ago',
		author: 'bot',
		status: 'provisioning',
		duration: 'Running...',
		env: 'preview',
		isCurrent: false,
	},
	{
		id: 'd3',
		projectId: '3',
		projectName: 'docs',
		repo: 'aamini/docs',
		commitMessage: 'Fix typos in quickstart',
		commitSha: 'i9j0k1l2',
		branch: 'main',
		timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
		time: '1h ago',
		author: 'aria',
		status: 'built',
		duration: '1m 20s',
		env: 'production',
		isCurrent: true,
	},
	{
		id: 'd4',
		projectId: '4',
		projectName: 'auth-service',
		repo: 'aamini/auth-service',
		commitMessage: 'Refactor session handling',
		commitSha: 'm3n4o5p6',
		branch: 'fix/oauth-flow',
		timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
		time: '4h ago',
		author: 'aria',
		status: 'failed',
		duration: '25s',
		env: 'preview',
		isCurrent: false,
	},
	{
		id: 'd5',
		projectId: '1',
		projectName: 'nexus-dashboard',
		repo: 'aamini/nexus-dashboard',
		commitMessage: 'Hotfix: responsive layout',
		commitSha: 'q7r8s9t0',
		branch: 'hotfix/ui',
		timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
		time: '6h ago',
		author: 'aria',
		status: 'built',
		duration: '52s',
		env: 'preview',
		isCurrent: false,
	},
	{
		id: 'd6',
		projectId: '2',
		projectName: 'api-gateway',
		repo: 'aamini/api-gateway',
		commitMessage: 'Upgrade dependencies',
		commitSha: 'u1v2w3x4',
		branch: 'main',
		timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
		time: '1d ago',
		author: 'bot',
		status: 'canceled',
		duration: '8s',
		env: 'production',
		isCurrent: false,
	},
]

export const mockData = {
	getProjects: async () => {
		return PROJECTS.map((p) => ({
			...p,
			updatedAt: formatDistanceToNow(p.updatedAtTimestamp),
		}))
	},
	getProjectById: async (id: string) => {
		const project = PROJECTS.find((p) => p.id === id)
		if (!project) return null
		return {
			...project,
			updatedAt: formatDistanceToNow(project.updatedAtTimestamp),
		}
	},
	getDeployments: async (options?: {
		projectId?: string
		limit?: number
		offset?: number
	}) => {
		let filtered = DEPLOYMENTS
		if (options?.projectId) {
			filtered = filtered.filter((d) => d.projectId === options.projectId)
		}

		const total = filtered.length
		const limit = options?.limit ?? 10
		const offset = options?.offset ?? 0

		const items = filtered.slice(offset, offset + limit).map((d) => ({
			...d,
			time: formatDistanceToNow(d.timestamp),
		}))

		return {
			items,
			total,
			limit,
			offset,
		}
	},
	getDeploymentById: async (id: string) => {
		const deployment = DEPLOYMENTS.find((d) => d.id === id)
		if (!deployment) return null
		return {
			...deployment,
			time: formatDistanceToNow(deployment.timestamp),
		}
	},
}
