import { getColorFromString } from '@/lib/utils'
import { getProjects } from '@/routes/api/projects'
import type { Project } from '@/types'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import {
	Clock,
	ExternalLink,
	GitBranch,
	Github,
	Plus,
	Search,
} from 'lucide-react'

export const Route = createFileRoute('/')({
	component: Home,
	beforeLoad: async () => {
		try {
			// Dynamic import to avoid bundling server-only code
			const { getCurrentUser } = await import('@/lib/session')
			await getCurrentUser()
		} catch {
			throw redirect({ to: '/login' })
		}
	},
	loader: async () => await getProjects(),
})

function Home() {
	const projects = Route.useLoaderData()

	return (
		<div className="mx-auto max-w-7xl">
			{/* Header Actions */}
			<div className="mb-8 flex flex-col gap-4 border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:flex-row sm:items-center sm:justify-between">
				<div className="relative max-w-sm flex-1">
					<Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-black" />
					<input
						type="text"
						placeholder="Search projects..."
						className="w-full border-2 border-black bg-[#E0E7F1] py-3 pr-4 pl-10 text-sm font-bold text-black placeholder-neutral-500 transition-all focus:bg-white focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
					/>
				</div>
				<button className="flex items-center gap-2 border-2 border-black bg-[#FF7E33] px-6 py-3 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-[2px_2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-[4px_4px] active:shadow-none">
					<Plus className="h-5 w-5" />
					NEW PROJECT
				</button>
			</div>

			{/* Projects Grid */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{projects.map((project: Project) => (
					<ProjectCard key={project.id} project={project} />
				))}
			</div>
		</div>
	)
}

function ProjectCard({ project }: { project: Project }) {
	return (
		<div className="group relative border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-[-2px_-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
			<div className="mb-4 flex items-start justify-between">
				<div className="flex items-center gap-3">
					<div
						className="flex size-12 items-center justify-center border-2 border-black text-xl font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
						style={{ backgroundColor: getColorFromString(project.name ?? '') }}
					>
						{project.name ? project.name[0]?.toUpperCase() : '?'}
					</div>
					<div>
						<Link
							to="/project/$projectId"
							params={{ projectId: project.id }}
							className="block text-lg font-bold text-black decoration-2 transition-colors group-hover:text-blue-600 hover:underline"
						>
							{project.name}
						</Link>
						<a
							href={`https://${project.domain}`}
							target="_blank"
							rel="noreferrer"
							className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-black hover:underline"
						>
							{project.domain}
						</a>
					</div>
				</div>
				<StatusBadge status={project.status} />
			</div>

			<div className="mt-4 space-y-4 border-t-2 border-dashed border-black pt-4">
				<div className="flex items-center gap-2 text-sm text-black">
					<GitBranch className="h-4 w-4" />
					<span className="border border-black bg-neutral-100 px-1.5 py-0.5 font-mono text-xs font-bold">
						{project.branch}
					</span>
					<span className="max-w-[120px] truncate font-medium">
						{project.commit}
					</span>
				</div>
				<div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
					<Clock className="h-3 w-3" />
					<span>{project.updatedAt}</span>
					<span>•</span>
					<span>{project.author}</span>
				</div>
			</div>

			<div className="mt-6 flex items-center gap-2 pt-2">
				<a
					href="https://github.com"
					target="_blank"
					rel="noreferrer"
					className="flex items-center gap-1.5 border-2 border-transparent px-2 py-1 text-xs font-bold text-black transition-all hover:border-black"
				>
					<Github className="h-3.5 w-3.5" />
					Repository
				</a>
				<div className="flex-1" />
				<a
					href={`https://${project.domain}`}
					target="_blank"
					rel="noreferrer"
					className="flex items-center gap-1.5 border-2 border-transparent px-2 py-1 text-xs font-bold text-black transition-all hover:border-black"
				>
					Visit
					<ExternalLink className="h-3 w-3" />
				</a>
			</div>
		</div>
	)
}

function StatusBadge({ status }: { status: 'ready' | 'building' | 'error' }) {
	const styles = {
		ready: 'bg-[#00FF00] text-black border-black',
		building: 'bg-[#FFFF00] text-black border-black',
		error: 'bg-[#FF0000] text-black border-black',
	}

	const labels = {
		ready: 'READY',
		building: 'BUILDING',
		error: 'ERROR',
	}

	return (
		<span
			className={`border-2 px-2 py-1 text-[10px] font-black tracking-wider uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${styles[status]}`}
		>
			<div className="flex items-center gap-1.5">{labels[status]}</div>
		</span>
	)
}
