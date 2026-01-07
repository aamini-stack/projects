/// <reference types="vite/client" />

import {
	Breadcrumb,
	BreadcrumbSegment,
	BreadcrumbSeparator,
} from '@/components/Breadcrumb'
import { ContextualTabs } from '@/components/ContextualTabs'
import { ProjectSwitcher } from '@/components/ProjectSwitcher'
import { getBreadcrumbsFromRoute } from '@/lib/breadcrumbs'
import appCss from '@/styles.css?url'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@aamini/ui/components/dropdown-menu'
import {
	createRootRoute,
	HeadContent,
	Link,
	Outlet,
	Scripts,
	useLocation,
	useParams,
} from '@tanstack/react-router'
import { LogOut, Settings as SettingsIcon } from 'lucide-react'
import posthog from 'posthog-js'

if (import.meta.env.MODE !== 'development') {
	posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
		api_host: '/api/analytics',
		ui_host: 'https://us.posthog.com',
		defaults: '2025-05-24',
		person_profiles: 'always',
	})
}

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{
				title: 'Nexus PaaS',
			},
		],
		links: [{ rel: 'stylesheet', href: appCss }],
	}),
	component: RootComponent,
})

function RootComponent() {
	const location = useLocation()
	const params = useParams({ strict: false })

	// Get breadcrumbs based on current route
	const breadcrumbs = getBreadcrumbsFromRoute(
		location.pathname,
		params.projectId,
		params.deploymentId,
	)

	// Determine if we're on a project route to show contextual tabs
	const isProjectRoute =
		location.pathname.startsWith('/project/') && params.projectId

	// Determine active tab
	let activeTab = 'Overview'
	if (location.pathname.includes('/deployments')) {
		activeTab = 'Deployments'
	} else if (location.pathname.includes('/configuration')) {
		activeTab = 'Configuration'
	} else if (location.pathname.includes('/settings')) {
		activeTab = 'Settings'
	}

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen bg-[#E0E7F1] font-sans text-black antialiased selection:bg-black selection:text-white">
				<div className="flex min-h-screen flex-col">
					{/* Navbar */}
					<nav className="fixed top-0 left-0 z-50 w-full border-b-2 border-black bg-white">
						<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
							<div className="flex items-center gap-4">
								{/* Logo */}
								<Link
									to="/"
									className="group flex items-center gap-3 text-xl font-bold tracking-tight"
								>
									<div className="flex size-10 items-center justify-center border-2 border-black bg-blue-500 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform group-hover:translate-[1px_1px] group-hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
										<svg
											width="20"
											height="20"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="3"
											strokeLinecap="round"
											strokeLinejoin="round"
											className="text-white"
										>
											<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
										</svg>
									</div>
									<span className="hidden text-black sm:inline">Nexus</span>
								</Link>

								{/* Breadcrumb Navigation */}
								<Breadcrumb>
									{breadcrumbs.map((crumb, index) => (
										<div key={index} className="flex items-center gap-2">
											{index > 0 && <BreadcrumbSeparator />}
											<BreadcrumbSegment
												href={crumb.href}
												isLast={index === breadcrumbs.length - 1}
												dropdown={
													crumb.hasDropdown ? (
														<ProjectSwitcher
															currentProjectId={params.projectId}
														>
															<button className="flex items-center gap-1 border-2 border-black bg-white px-3 py-1.5 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-[1px_1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
																<span className="flex items-center gap-1">
																	{crumb.label}
																	<svg
																		width="12"
																		height="12"
																		viewBox="0 0 24 24"
																		fill="none"
																		stroke="currentColor"
																		strokeWidth="3"
																		strokeLinecap="round"
																		strokeLinejoin="round"
																	>
																		<polyline points="6 9 12 15 18 9" />
																	</svg>
																</span>
															</button>
														</ProjectSwitcher>
													) : undefined
												}
											>
												{crumb.label}
											</BreadcrumbSegment>
										</div>
									))}
								</Breadcrumb>
							</div>

							<div className="flex h-16 items-center">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<div className="flex size-10 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-purple-500 text-sm font-bold text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all outline-none hover:translate-[1px_1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
											AA
										</div>
									</DropdownMenuTrigger>

									<DropdownMenuContent
										className="min-w-[180px]"
										sideOffset={12}
										align="end"
									>
										<DropdownMenuItem className="group/item mb-1 flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-xs font-black uppercase transition-colors outline-none hover:bg-black hover:text-white">
											<SettingsIcon className="size-4 shrink-0 transition-transform group-hover/item:rotate-90" />
											General Settings
										</DropdownMenuItem>

										<DropdownMenuSeparator />

										<DropdownMenuItem className="group/item flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-xs font-black uppercase transition-colors outline-none hover:bg-red-500 hover:text-white">
											<LogOut className="size-4 shrink-0 transition-transform group-hover/item:-translate-x-1" />
											Logout
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</nav>

					{/* Contextual Tabs */}
					{isProjectRoute && (
						<div className="fixed top-16 left-0 z-40 w-full">
							<ContextualTabs
								tabs={[
									{ label: 'Overview', href: `/project/${params.projectId}` },
									{
										label: 'Deployments',
										href: `/project/${params.projectId}/deployments`,
									},
									{
										label: 'Configuration',
										href: `/project/${params.projectId}/configuration`,
									},
								]}
								activeTab={activeTab}
							/>
						</div>
					)}

					{/* Main content */}
					<main className={`flex-1 p-6 ${isProjectRoute ? 'pt-32' : 'pt-24'}`}>
						<Outlet />
					</main>
				</div>
				<Scripts />
			</body>
		</html>
	)
}
