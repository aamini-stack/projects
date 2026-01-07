import { getProjectDeployments } from '@/routes/api/deployments'
import type { Deployment } from '@/types'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@aamini/ui/components/dropdown-menu'
import { createFileRoute } from '@tanstack/react-router'
import {
	Filter,
	GitBranch,
	Github,
	ExternalLink as LinkIcon,
	MoreHorizontal,
	RefreshCw,
	Rocket,
	Search,
	Trash2,
	Zap,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/project/$projectId/deployments')({
	component: ProjectDeploymentsPage,
	loader: async ({ params }) =>
		await getProjectDeployments({ data: { projectId: params.projectId } }),
})

function ProjectDeploymentsPage() {
	const { items: projectDeployments } = Route.useLoaderData()
	const [statusFilter, setStatusFilter] = useState('all')

	return (
		<div className="w-full">
			<div className="mx-auto max-w-7xl min-w-fit px-4 pb-20 md:px-8">
				{/* Control Panel */}
				<div className="mb-0 flex flex-col items-center justify-between gap-4 border-2 border-b-0 border-black bg-black p-4 text-white lg:flex-row">
					<div className="flex w-full items-center gap-4 lg:w-auto">
						<div className="group relative w-full lg:w-64">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<Search className="h-4 w-4 text-neutral-400 transition-colors group-focus-within:text-white" />
							</div>
							<input
								type="text"
								placeholder="SEARCH REFERENCE..."
								className="block w-full border border-neutral-700 bg-neutral-900 py-2 pr-3 pl-10 font-mono text-sm text-white uppercase placeholder-neutral-500 transition-all focus:border-white focus:bg-black focus:outline-none"
							/>
						</div>
						<div className="hidden h-6 w-px bg-neutral-800 lg:block" />
						<div className="flex gap-2">
							<FilterButton
								active={statusFilter !== 'all'}
								onClick={() =>
									setStatusFilter(statusFilter === 'all' ? 'failed' : 'all')
								}
							>
								<Filter className="size-3.5" />
								<span>FILTER</span>
							</FilterButton>
							<FilterButton onClick={() => {}}>
								<RefreshCw className="size-3.5" />
								<span>REFRESH</span>
							</FilterButton>
						</div>
					</div>
				</div>

				{/* Main Data Table */}
				<div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
					{projectDeployments.length === 0 ? (
						<div className="p-12 text-center">
							<div className="mx-auto mb-4 flex size-16 items-center justify-center border-2 border-black bg-neutral-100">
								<Rocket className="size-8 text-neutral-400" />
							</div>
							<h3 className="mb-2 text-lg font-black text-black uppercase">
								No Deployments Yet
							</h3>
							<p className="text-sm font-bold text-neutral-500">
								Push to your repository to trigger your first deployment
							</p>
						</div>
					) : (
						<div>
							<table className="w-full min-w-[600px] border-collapse text-left">
								<thead>
									<tr className="border-b-2 border-black bg-neutral-100 text-xs font-black text-black">
										<th className="p-4 tracking-wider uppercase">Status</th>
										<th className="p-4 tracking-wider uppercase">Commit</th>
										<th className="p-4 tracking-wider uppercase">Timing</th>
										<th className="w-[1%] p-4 text-right tracking-wider whitespace-nowrap uppercase">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-neutral-200">
									{projectDeployments
										.filter((d: Deployment) => {
											if (statusFilter !== 'all' && d.status !== statusFilter)
												return false
											return true
										})
										.map((deployment: Deployment) => (
											<DeploymentRow
												key={deployment.id}
												deployment={deployment}
											/>
										))}
								</tbody>
							</table>
						</div>
					)}

					{projectDeployments.length > 0 && (
						<div className="flex items-center justify-between border-t-2 border-black bg-neutral-50 p-4 font-mono text-xs font-bold">
							<span>
								SHOWING 1-{projectDeployments.length} OF{' '}
								{projectDeployments.length}
							</span>
							<div className="flex gap-2">
								<button
									className="border-2 border-black bg-white px-4 py-1 transition-colors hover:bg-black hover:text-white disabled:opacity-50"
									disabled
								>
									PREV
								</button>
								<button
									className="border-2 border-black bg-white px-4 py-1 transition-colors hover:bg-black hover:text-white disabled:opacity-50"
									disabled
								>
									NEXT
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

function FilterButton({
	children,
	active,
	onClick,
}: {
	children: React.ReactNode
	active?: boolean
	onClick: () => void
}) {
	return (
		<button
			onClick={onClick}
			className={`flex items-center gap-2 border border-neutral-700 px-3 py-1.5 font-mono text-xs font-bold transition-all ${
				active
					? 'border-white bg-white text-black'
					: 'text-neutral-300 hover:border-white hover:text-white'
			}`}
		>
			{children}
		</button>
	)
}

function DeploymentRow({ deployment }: { deployment: Deployment }) {
	const url =
		deployment.env === 'production'
			? `https://${deployment.projectName}.nexus.sh`
			: `https://${deployment.id}.${deployment.projectName}.nexus.sh`

	const statusColors = {
		built: 'bg-[#00FF00]',
		provisioning: 'bg-[#FFFF00]',
		failed: 'bg-[#FF0000]',
		canceled: 'bg-neutral-300',
	}

	return (
		<tr className="group transition-colors hover:bg-neutral-50">
			{/* Status */}
			<td className="px-4 py-3">
				<div className="flex items-center gap-3">
					<div
						className={`size-3 shrink-0 rounded-full border border-black/10 ${statusColors[deployment.status]}`}
					/>
					<div className="flex flex-col">
						<span className="text-sm font-semibold capitalize">
							{deployment.status}
						</span>
						<div className="flex items-center gap-2">
							<span
								className={`w-fit rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase ${
									deployment.env === 'production'
										? 'bg-black text-white'
										: 'bg-neutral-200 text-neutral-600'
								}`}
							>
								{deployment.env === 'production' ? 'PROD' : 'PREVIEW'}
							</span>
							{deployment.isCurrent && (
								<div className="flex items-center gap-1 rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] font-black text-white">
									<Zap className="size-2.5 fill-current" />
									CURRENT
								</div>
							)}
						</div>
					</div>
				</div>
			</td>

			{/* Commit */}
			<td className="px-4 py-3">
				<div className="flex min-w-0 flex-col gap-0.5">
					<span className="max-w-xs truncate text-sm font-medium">
						{deployment.commitMessage}
					</span>
					<div className="flex items-center gap-2 text-xs text-neutral-500">
						<span className="flex items-center gap-1">
							<GitBranch className="size-3" />
							<span className="font-mono">{deployment.branch}</span>
						</span>
						<span className="text-neutral-300">•</span>
						<span className="flex items-center gap-1">
							<Github className="size-3" />
							<span>{deployment.author}</span>
						</span>
					</div>
				</div>
			</td>

			{/* Timing */}
			<td className="px-4 py-3">
				<div className="flex flex-col gap-0.5">
					<span className="text-sm font-medium">{deployment.time}</span>
					<span className="text-xs text-neutral-500">
						{deployment.duration}
					</span>
				</div>
			</td>

			{/* Actions */}
			<td className="px-4 py-3 text-right">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button className="group flex size-9 -translate-y-px cursor-pointer items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors outline-none hover:translate-y-px hover:bg-black hover:text-white hover:shadow-none">
							<MoreHorizontal className="size-5 transition-transform group-hover:scale-110" />
						</button>
					</DropdownMenuTrigger>

					<DropdownMenuContent
						className="min-w-[200px]"
						sideOffset={8}
						align="end"
					>
						<DropdownMenuItem
							className="group/item mb-1 flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-xs font-black uppercase transition-colors outline-none hover:bg-black hover:text-white"
							onSelect={() => window.open(url, '_blank')}
						>
							<LinkIcon className="size-4 shrink-0 transition-transform group-hover/item:rotate-12" />
							Visit Deployment
						</DropdownMenuItem>

						{deployment.env !== 'production' && (
							<DropdownMenuItem className="group/item mb-1 flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-xs font-black uppercase transition-colors outline-none hover:bg-blue-500 hover:text-white">
								<Rocket className="size-4 shrink-0 transition-transform group-hover/item:-translate-y-0.5" />
								Promote to Production
							</DropdownMenuItem>
						)}

						<DropdownMenuSeparator />

						<DropdownMenuItem className="group/item flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-xs font-black uppercase transition-colors outline-none hover:bg-red-500 hover:text-white">
							<Trash2 className="size-4 shrink-0 transition-transform group-hover/item:scale-110" />
							Delete Deployment
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</td>
		</tr>
	)
}
