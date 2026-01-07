import { getDeployment } from '@/routes/api/deployments'
import { createFileRoute } from '@tanstack/react-router'
import {
	CheckCircle2,
	ExternalLink,
	GitBranch,
	Github,
	Globe,
	Share2,
	XCircle,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute(
	'/project/$projectId/deployments/$deploymentId',
)({
	component: DeploymentDetailPage,
	loader: async ({ params }) =>
		await getDeployment({ data: params.deploymentId }),
})

function DeploymentDetailPage() {
	const deployment = Route.useLoaderData()
	const [activeTab, setActiveTab] = useState('Deployment')

	if (!deployment) {
		return (
			<div className="mx-auto max-w-7xl">
				<div className="flex min-h-[400px] flex-col items-center justify-center">
					<div className="mb-4 flex size-20 items-center justify-center border-2 border-black bg-neutral-100">
						<XCircle className="size-10 text-neutral-400" />
					</div>
					<h2 className="mb-2 text-2xl font-black text-black uppercase">
						Deployment Not Found
					</h2>
					<p className="text-sm font-bold text-neutral-500">
						The deployment you're looking for doesn't exist or has been deleted
					</p>
				</div>
			</div>
		)
	}

	const url =
		deployment.env === 'production'
			? `https://${deployment.projectName}.nexus.sh`
			: `https://${deployment.id}.${deployment.projectName}.nexus.sh`

	const tabs = ['Deployment', 'Logs', 'Resources', 'Source', 'Open Graph']

	return (
		<div className="mx-auto max-w-7xl">
			{/* Deployment Preview */}
			<div className="mb-8 border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-xl font-black text-black uppercase">
						Deployment Preview
					</h2>
					<div className="flex gap-2">
						<a
							href={url}
							target="_blank"
							rel="noreferrer"
							className="flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-[2px_2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-[4px_4px] active:shadow-none"
						>
							<ExternalLink className="size-4" />
							Visit
						</a>
						<button className="flex items-center gap-2 border-2 border-black bg-[#60A5FA] px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-[2px_2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-[4px_4px] active:shadow-none">
							<Share2 className="size-4" />
							Share
						</button>
					</div>
				</div>

				{/* Preview Area */}
				<div className="relative aspect-video w-full overflow-hidden border-2 border-black bg-neutral-100">
					<div className="absolute inset-0 flex items-center justify-center text-neutral-400">
						<Globe className="size-12 opacity-20" />
					</div>
					{/* Overlay Info */}
					<div className="absolute inset-x-0 bottom-0 border-t-2 border-black bg-white p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2 font-bold text-black">
								{deployment.status === 'built' && (
									<>
										<CheckCircle2 className="size-5 fill-black text-emerald-500" />
										<span>Ready</span>
									</>
								)}
								{deployment.status === 'failed' && (
									<>
										<XCircle className="size-5 fill-black text-red-500" />
										<span>Failed</span>
									</>
								)}
								{deployment.status === 'provisioning' && (
									<>
										<div className="size-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
										<span>Building</span>
									</>
								)}
								<span className="text-neutral-400">•</span>
								<span className="text-sm text-neutral-500">
									{deployment.time}
								</span>
							</div>
							<a
								href={url}
								target="_blank"
								rel="noreferrer"
								className="border-2 border-black bg-[#E0E7F1] px-3 py-1 text-xs font-bold text-black transition-all hover:bg-white hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
							>
								{url.replace('https://', '')}
							</a>
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
				{/* Main Content */}
				<div className="space-y-8 lg:col-span-2">
					{/* Tabs */}
					<div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						<div className="flex gap-6 border-b-2 border-black bg-neutral-50 px-6 text-sm font-bold">
							{tabs.map((tab) => (
								<button
									key={tab}
									onClick={() => setActiveTab(tab)}
									className={`-mb-[2px] border-b-2 px-1 py-4 transition-all ${
										activeTab === tab
											? 'border-black text-black'
											: 'border-transparent text-neutral-500 hover:border-black/20 hover:text-black'
									}`}
								>
									{tab}
								</button>
							))}
						</div>

						<div className="p-6">
							{activeTab === 'Deployment' && (
								<div className="space-y-4">
									<h3 className="font-black text-black uppercase">
										Deployment Details
									</h3>
									<div className="space-y-3">
										<div className="flex items-center justify-between text-sm font-bold">
											<span className="text-neutral-500">Status</span>
											<span className="text-black capitalize">
												{deployment.status}
											</span>
										</div>
										<div className="flex items-center justify-between text-sm font-bold">
											<span className="text-neutral-500">Environment</span>
											<span
												className={`px-2 py-0.5 text-xs ${
													deployment.env === 'production'
														? 'bg-black text-white'
														: 'bg-neutral-200 text-neutral-600'
												}`}
											>
												{deployment.env.toUpperCase()}
											</span>
										</div>
										<div className="flex items-center justify-between text-sm font-bold">
											<span className="text-neutral-500">Duration</span>
											<span className="text-black">{deployment.duration}</span>
										</div>
										<div className="flex items-center justify-between text-sm font-bold">
											<span className="text-neutral-500">Created</span>
											<span className="text-black">{deployment.time}</span>
										</div>
									</div>
								</div>
							)}
							{activeTab !== 'Deployment' && (
								<div className="py-8 text-center text-sm font-bold text-neutral-400">
									{activeTab} content coming soon
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Commit Info */}
					<div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						<h3 className="mb-4 font-black text-black uppercase">
							Commit Details
						</h3>
						<div className="space-y-3">
							<div>
								<div className="mb-1 text-xs font-bold text-neutral-500">
									MESSAGE
								</div>
								<div className="text-sm font-bold text-black">
									{deployment.commitMessage}
								</div>
							</div>
							<div className="border-t-2 border-dashed border-black pt-3">
								<div className="mb-1 text-xs font-bold text-neutral-500">
									BRANCH
								</div>
								<div className="flex items-center gap-1.5 text-sm font-bold text-black">
									<GitBranch className="size-3.5" />
									<span className="border border-black bg-neutral-100 px-1 font-mono">
										{deployment.branch}
									</span>
								</div>
							</div>
							<div className="border-t-2 border-dashed border-black pt-3">
								<div className="mb-1 text-xs font-bold text-neutral-500">
									AUTHOR
								</div>
								<div className="flex items-center gap-1.5 text-sm font-bold text-black">
									<Github className="size-3.5" />
									<span>{deployment.author}</span>
								</div>
							</div>
							<div className="border-t-2 border-dashed border-black pt-3">
								<div className="mb-1 text-xs font-bold text-neutral-500">
									COMMIT SHA
								</div>
								<span className="border border-black bg-yellow-100 px-1 font-mono text-xs text-black">
									{deployment.commitSha?.slice(0, 7) || 'abc123d'}
								</span>
							</div>
						</div>
					</div>

					{/* Domain Info */}
					<div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						<h3 className="mb-4 font-black text-black uppercase">Domains</h3>
						<div className="space-y-2">
							<a
								href={url}
								target="_blank"
								rel="noreferrer"
								className="flex items-center gap-2 text-sm font-bold text-black decoration-2 transition-colors hover:underline"
							>
								<Globe className="size-4" />
								{url.replace('https://', '')}
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
