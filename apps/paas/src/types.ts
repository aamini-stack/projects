export interface Project {
	id: string
	name: string
	domain: string
	status: 'ready' | 'building' | 'error'
	branch: string
	commit: string
	updatedAt: string // Human friendly display
	updatedAtTimestamp: string // ISO string
	author: string
	repo?: string
}

export interface Deployment {
	id: string
	projectId: string
	projectName: string
	repo: string
	commitMessage: string
	commitSha: string
	branch: string
	time: string // Human friendly display
	timestamp: string // ISO string
	duration: string
	author: string
	status: 'built' | 'provisioning' | 'failed' | 'canceled'
	env: 'production' | 'preview'
	isCurrent: boolean
}

export interface EnvironmentVariable {
	id: string
	projectId: string
	key: string
	value: string // stored encrypted
	scope: 'production' | 'preview' | 'development' | 'all'
}

export interface Domain {
	id: string
	projectId: string
	domain: string
	type: 'auto' | 'custom'
	sslStatus: 'pending' | 'active' | 'error'
	dnsStatus: 'pending' | 'verified' | 'error'
}
