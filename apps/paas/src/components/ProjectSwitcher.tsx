import { getColorFromString } from '@/lib/utils'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useNavigate } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

interface Project {
	id: string
	name: string
	status: 'active' | 'paused' | 'building'
}

interface ProjectSwitcherProps {
	currentProjectId?: string | undefined
	children: ReactNode
}

// Mock function - will be replaced with real data fetching
function getAllProjects(): Project[] {
	return [
		{ id: '1', name: 'nexus-dashboard', status: 'active' },
		{ id: '2', name: 'api-gateway', status: 'active' },
		{ id: '3', name: 'analytics-platform', status: 'building' },
		{ id: '4', name: 'auth-service', status: 'paused' },
	]
}

export function ProjectSwitcher({
	currentProjectId,
	children,
}: ProjectSwitcherProps) {
	const navigate = useNavigate()
	const projects = getAllProjects()

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content
					className="z-50 min-w-70 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
					sideOffset={8}
					align="start"
				>
					{projects.length === 0 ? (
						<div className="p-4 text-center text-sm font-bold text-neutral-500">
							No projects found
						</div>
					) : (
						projects.map((project, index) => (
							<DropdownMenu.Item
								key={project.id}
								className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors outline-none hover:bg-[#E0E7F1] ${
									index !== projects.length - 1
										? 'border-b-2 border-black/10'
										: ''
								}`}
								onSelect={() => {
									void navigate({
										to: '/project/$projectId',
										params: { projectId: project.id },
									})
								}}
							>
								{/* Project Avatar */}
								<div
									className="flex size-10 shrink-0 items-center justify-center border-2 border-black text-sm font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
									style={{ backgroundColor: getColorFromString(project.name) }}
								>
									{project.name[0]?.toUpperCase() ?? '?'}
								</div>

								{/* Project Info */}
								<div className="min-w-0 flex-1">
									<div className="truncate font-bold text-black">
										{project.name}
									</div>
									<div className="text-xs font-bold text-neutral-500">
										{project.status === 'active' && 'Active'}
										{project.status === 'paused' && 'Paused'}
										{project.status === 'building' && 'Building'}
									</div>
								</div>

								{/* Current Project Indicator */}
								{project.id === currentProjectId && (
									<Check className="size-5 text-black" />
								)}
							</DropdownMenu.Item>
						))
					)}
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	)
}
