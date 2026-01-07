import { getColorFromString } from '@/lib/utils'
import { getProjectDeployments } from '@/routes/api/deployments'
import { getProject } from '@/routes/api/projects'
import type { Deployment } from '@/types'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
	CheckCircle2,
	ExternalLink,
	GitBranch,
	Github,
	Globe,
	XCircle,
} from 'lucide-react'

export const Route = createFileRoute('/project/$projectId/')({
	component: ProjectOverview,
	loader: async ({ params }) => {
		const [project, deployments] = await Promise.all([
			getProject({ data: params.projectId }),
			getProjectDeployments({ data: { projectId: params.projectId } }),
		])
		return { project, deployments: deployments.items }
	},
})

function ProjectOverview() {
	const { project, deployments } = Route.useLoaderData()
	const { projectId } = Route.useParams()

	if (!project) {
		return <div>Project not found</div>
	}

	return (
		<div className="mx-auto max-w-7xl">
			{/* Project Header */}
			<div className="mb-8 border-b-2 border-dashed border-black pb-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div
							className="flex size-20 items-center justify-center border-2 border-black text-3xl font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
							style={{
								backgroundColor: getColorFromString(project.name ?? ''),
							}}
						>
							{project.name?.[0]?.toUpperCase() ?? '?'}
						</div>
						<div>
							<h1 className="mb-1 text-4xl font-black tracking-tight text-black">
								{project.name}
							</h1>
							<div className="flex items-center gap-4 text-sm font-bold text-neutral-600">
								<a
									href={`https://github.com/${project.repo}`}
									className="flex items-center gap-1 decoration-2 transition-colors hover:text-black hover:underline"
								>
									<Github className="size-4" />
									{project.repo}
								</a>
								<a
									href={`https://${project.domain}`}
									className="flex items-center gap-1 decoration-2 transition-colors hover:text-black hover:underline"
								>
									<Globe className="size-4" />
									{project.domain}
								</a>
							</div>
						</div>
					</div>
					<div className="flex gap-3">
						<button className="flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-[2px_2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-[4px_4px] active:shadow-none">
							<Github className="size-4" />
							View Repo
						</button>
						<button className="flex items-center gap-2 border-2 border-black bg-[#FF7E33] px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-[2px_2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-[4px_4px] active:shadow-none">
							Visit
							<ExternalLink className="size-4" />
						</button>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
				{/* Main Content */}
				<div className="space-y-8 lg:col-span-2">
					{/* Production Deployment Card */}
					<div className="border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
						<h2 className="mb-4 text-xl font-black tracking-wide text-black uppercase">
							Production Deployment
						</h2>
						<div className="group relative aspect-video w-full overflow-hidden border-2 border-black bg-neutral-100">
							<div className="absolute inset-0 flex items-center justify-center text-neutral-400">
								<Globe className="size-12 opacity-20" />
							</div>
							{/* Overlay Info */}
							<div className="absolute inset-x-0 bottom-0 border-t-2 border-black bg-white p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2 font-bold text-black">
										<CheckCircle2 className="size-5 fill-black text-emerald-500" />
										<span>Ready</span>
										<span className="text-neutral-400">•</span>
										<span className="text-sm text-neutral-500">2m ago</span>
									</div>
									<a
										href={`https://${project.domain}`}
										target="_blank"
										rel="noreferrer"
										className="border-2 border-black bg-[#E0E7F1] px-3 py-1 text-xs font-bold text-black transition-all hover:bg-white hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
									>
										{project.domain}
									</a>
								</div>
							</div>
						</div>

						<div className="mt-6 space-y-3 border-t-2 border-dashed border-black pt-4">
							<div className="flex items-center justify-between text-sm font-bold">
								<span className="text-neutral-500">Deployment ID</span>
								<span className="border border-black bg-yellow-100 px-1 font-mono text-black">
									dpl_82k1...9j2k
								</span>
							</div>
							<div className="flex items-center justify-between text-sm font-bold">
								<span className="text-neutral-500">Domains</span>
								<div className="flex gap-2">
									<Badge>{project.domain}</Badge>
									<Badge>www.{project.domain}</Badge>
								</div>
							</div>
							<div className="flex items-center justify-between text-sm font-bold">
								<span className="text-neutral-500">Branch</span>
								<div className="flex items-center gap-1.5 text-black">
									<GitBranch className="size-3.5" />
									<span className="border border-black bg-neutral-100 px-1 font-mono">
										main
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Recent Activity */}
					<div>
						<h2 className="mb-4 text-xl font-black tracking-wide text-black uppercase">
							Latest Deployments
						</h2>
						<div className="border-2 border-black bg-white text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
							{deployments.length === 0 ? (
								<div className="p-8 text-center font-bold text-neutral-500">
									No deployments found
								</div>
							) : (
								deployments.slice(0, 5).map((deploy: Deployment, i: number) => (
									<div
										key={deploy.id}
										className={`flex items-center justify-between p-4 transition-colors hover:bg-[#E0E7F1] ${
											i !== Math.min(deployments.length, 5) - 1
												? 'border-b-2 border-black'
												: ''
										}`}
									>
										<div className="flex items-center gap-4">
											<StatusIcon status={deploy.status as any} />
											<div>
												<div className="mb-0.5 font-bold text-black">
													{deploy.commitMessage}
												</div>
												<div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
													<span className="border border-black bg-neutral-100 px-1 font-mono text-black">
														{deploy.branch}
													</span>
													<span>•</span>
													<span>{deploy.time}</span>
													<span>•</span>
													<span>by {deploy.author}</span>
												</div>
											</div>
										</div>
										<div className="flex items-center gap-4">
											<span className="font-mono text-xs font-bold text-neutral-500">
												{deploy.duration}
											</span>
											<button className="border-2 border-transparent p-2 transition-all hover:border-black hover:bg-white">
												<ExternalLink className="size-4" />
											</button>
										</div>
									</div>
								))
							)}
						</div>
						<Link
							to="/project/$projectId/deployments"
							params={{ projectId }}
							className="mt-4 block w-full border-2 border-black bg-white py-3 text-center text-sm font-black text-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-[2px_2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-[4px_4px] active:shadow-none"
						>
							View All Deployments
						</Link>
					</div>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					<div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						<h3 className="mb-4 font-black text-black uppercase">
							Environment
						</h3>
						<div className="space-y-3">
							<div className="flex items-center justify-between text-sm font-bold">
								<span className="text-neutral-500">Node Version</span>
								<span className="border border-black bg-neutral-100 px-1 font-mono text-xs text-black">
									18.x
								</span>
							</div>
							<div className="flex items-center justify-between text-sm font-bold">
								<span className="text-neutral-500">Framework</span>
								<span className="text-black">Next.js</span>
							</div>
							<div className="flex items-center justify-between text-sm font-bold">
								<span className="text-neutral-500">Region</span>
								<span className="flex items-center gap-1.5 text-black">
									<img
										src="https://flagcdn.com/us.svg"
										className="h-3 w-4 border border-black"
										alt="US"
									/>
									us-east-1
								</span>
							</div>
						</div>
						<div className="mt-6 border-t-2 border-dashed border-black pt-4">
							<button className="w-full border-2 border-black bg-white py-2 text-sm font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-[#A3E635]">
								EDIT VARIABLES
							</button>
						</div>
					</div>

					<div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						<h3 className="mb-4 font-black text-black uppercase">Repository</h3>
						<div className="mb-4 flex items-center gap-3">
							<Github className="size-5 text-black" />
							<div>
								<div className="text-sm font-bold text-black">
									{project.repo}
								</div>
								<div className="text-xs font-bold text-neutral-500">GitHub</div>
							</div>
						</div>
						<div className="text-sm font-medium text-neutral-600">
							Connected to{' '}
							<span className="border border-black bg-neutral-100 px-1 font-mono font-bold text-black">
								main
							</span>{' '}
							branch showing commits from folder{' '}
							<span className="border border-black bg-neutral-100 px-1 font-mono font-bold text-black">
								/
							</span>
							.
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

function Badge({ children }: { children: React.ReactNode }) {
	return (
		<span className="inline-flex items-center border border-black bg-white px-2 py-0.5 text-xs font-bold text-black">
			{children}
		</span>
	)
}

function StatusIcon({
	status,
}: {
	status: 'success' | 'built' | 'building' | 'provisioning' | 'error' | 'failed'
}) {
	if (status === 'success' || status === 'built')
		return (
			<div className="flex size-8 items-center justify-center border-2 border-black bg-[#00FF00] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
				<CheckCircle2 className="size-4 text-black" />
			</div>
		)
	if (status === 'building' || status === 'provisioning')
		return (
			<div className="flex size-8 items-center justify-center border-2 border-black bg-[#FFFF00] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
				<div className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
			</div>
		)
	if (status === 'error' || status === 'failed')
		return (
			<div className="flex size-8 items-center justify-center border-2 border-black bg-[#FF0000] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
				<XCircle className="size-4 text-black" />
			</div>
		)
	return (
		<div className="flex size-8 items-center justify-center border-2 border-black bg-neutral-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
	)
}
