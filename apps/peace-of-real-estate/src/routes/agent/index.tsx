import { createFileRoute, Link } from '@tanstack/react-router'
import {
	ArrowRight,
	ArrowLeft,
	Shield,
	CheckCircle2,
	DollarSign,
	Users,
} from 'lucide-react'
import { useState } from 'react'

import { FlowPageShell } from '@/components/flow-page-shell'

export const Route = createFileRoute('/agent/')({
	component: AgentFlow,
})

const categories = [
	{
		id: 'working-style',
		label: 'Working Style',
		description: 'How you prefer to work with clients',
	},
	{
		id: 'communication',
		label: 'Communication',
		description: 'Your approach to client updates and interactions',
	},
	{
		id: 'transparency',
		label: 'Transparency',
		description: 'How you handle fees, process, and expectations',
	},
	{
		id: 'fit',
		label: 'Overall Fit',
		description: 'The type of client relationships you excel at',
	},
]

function AgentFlow() {
	const [weights, setWeights] = useState<Record<string, number>>({
		'working-style': 3,
		communication: 3,
		transparency: 3,
		fit: 3,
	})

	const updateWeight = (id: string, value: number) => {
		setWeights((prev) => ({ ...prev, [id]: value }))
	}

	return (
		<FlowPageShell
			backTo="/"
			backLabel="Back to home"
			title="Agent Onboarding"
			subtitle="Step 1 of 4 — Set your priority weights"
			icon={Shield}
			iconClassName="border-terracotta bg-terracotta-tint text-terracotta"
		>
			{/* Value Props */}
			<div className="bg-border mb-10 grid gap-px sm:grid-cols-3">
				{[
					{
						icon: DollarSign,
						label: 'No subscription',
						desc: 'Pay only when matched',
					},
					{
						icon: Users,
						label: 'Quality leads',
						desc: 'Pre-qualified consumers',
					},
					{
						icon: CheckCircle2,
						label: 'Peace Pact',
						desc: 'Transparency from day one',
					},
				].map((item) => {
					const Icon = item.icon
					return (
						<div key={item.label} className="bg-card p-5 text-center">
							<Icon className="text-terracotta mx-auto mb-2 h-5 w-5" />
							<div className="text-sm font-medium">{item.label}</div>
							<div className="text-muted-foreground text-xs">{item.desc}</div>
						</div>
					)
				})}
			</div>

			{/* Category Weighting */}
			<div className="space-y-4">
				{categories.map((cat, i) => {
					const weight = weights[cat.id]
					return (
						<div
							key={cat.id}
							className="border-border bg-card card-institutional p-6"
							style={{ animationDelay: `${(i + 1) * 100}ms` }}
						>
							<div className="mb-4 flex items-start justify-between">
								<div>
									<h3 className="font-medium">{cat.label}</h3>
									<p className="text-muted-foreground text-xs">
										{cat.description}
									</p>
								</div>
								<span className="data-number border-terracotta bg-terracotta-tint text-terracotta flex h-8 w-8 items-center justify-center border text-sm font-bold">
									{weight}
								</span>
							</div>

							<div className="flex items-center gap-3">
								<span className="text-muted-foreground text-xs">Low</span>
								<input
									type="range"
									min={1}
									max={5}
									value={weight}
									onChange={(e) => updateWeight(cat.id, Number(e.target.value))}
									className="accent-foreground bg-border h-1 flex-1 cursor-pointer appearance-none"
								/>
								<span className="text-muted-foreground text-xs">High</span>
							</div>
						</div>
					)
				})}
			</div>

			{/* Navigation */}
			<div className="mt-10 flex items-center justify-between">
				<Link
					to="/"
					className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back
				</Link>
				<Link
					to="/agent/quiz"
					className="btn-primary inline-flex items-center gap-2"
				>
					Continue to Questions
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>
		</FlowPageShell>
	)
}
