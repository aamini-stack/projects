interface Breadcrumb {
	label: string
	href?: string
	hasDropdown?: boolean
}

export function getBreadcrumbsFromRoute(
	pathname: string,
	projectId?: string,
	deploymentId?: string,
): Breadcrumb[] {
	// Projects breadcrumb always has dropdown on homepage
	const breadcrumbs: Breadcrumb[] = [
		{ label: 'Projects', href: '/', hasDropdown: pathname === '/' },
	]

	// Handle project routes
	if (pathname.startsWith('/project/') && projectId) {
		const projectName = getProjectNameFromId(projectId)
		breadcrumbs.push({
			label: projectName,
			href: `/project/${projectId}`,
			hasDropdown: true,
		})

		// Handle nested project routes
		if (pathname.includes('/deployments')) {
			if (deploymentId) {
				breadcrumbs.push({
					label: 'Deployments',
					href: `/project/${projectId}/deployments`,
				})
				breadcrumbs.push({
					label: truncateDeploymentId(deploymentId),
				})
			} else {
				breadcrumbs.push({
					label: 'Deployments',
				})
			}
		}
	} else if (pathname === '/deployments') {
		breadcrumbs.push({ label: 'Deployments' })
	} else if (pathname === '/settings') {
		breadcrumbs.push({ label: 'Settings' })
	}

	return breadcrumbs
}

// Mock function to get project name from ID
// In production, this would fetch from API or route loader
export function getProjectNameFromId(projectId: string): string {
	const projectMap: Record<string, string> = {
		'1': 'nexus-dashboard',
		'2': 'api-gateway',
		'3': 'analytics-platform',
		'4': 'auth-service',
	}
	return projectMap[projectId] ?? `project-${projectId}`
}

// Mock function to get all projects
export function getAllProjects() {
	return [
		{ id: '1', name: 'nexus-dashboard', status: 'active' as const },
		{ id: '2', name: 'api-gateway', status: 'active' as const },
		{ id: '3', name: 'analytics-platform', status: 'building' as const },
		{ id: '4', name: 'auth-service', status: 'paused' as const },
	]
}

// Truncate deployment ID to first 8 characters
export function truncateDeploymentId(deploymentId: string): string {
	return deploymentId.length > 8
		? `${deploymentId.slice(0, 8)}...`
		: deploymentId
}
