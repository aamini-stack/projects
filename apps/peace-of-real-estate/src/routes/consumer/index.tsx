import { createFileRoute, Link } from '@tanstack/react-router'
import {
	ArrowRight,
	ArrowLeft,
	Heart,
	MessageCircle,
	Eye,
	Star,
	SlidersHorizontal,
} from 'lucide-react'
import { useState } from 'react'

import { FlowPageShell } from '@/components/flow-page-shell'

export const Route = createFileRoute('/consumer/')({
	component: ConsumerFlow,
})

const categories = [
	{
		id: 'working-style',
		label: 'Working Style',
		icon: Heart,
		color: 'teal',
		description: 'How hands-on or independent you prefer your agent to be',
	},
	{
		id: 'communication',
		label: 'Communication',
		icon: MessageCircle,
		color: 'terracotta',
		description: 'Frequency, channels, and style of updates',
	},
	{
		id: 'transparency',
		label: 'Transparency',
		icon: Eye,
		color: 'olive',
		description: 'Clarity on fees, process, and expectations',
	},
	{
		id: 'fit',
		label: 'Overall Fit',
		icon: Star,
		color: 'ochre',
		description: 'The intangible chemistry that makes it click',
	},
]

function ConsumerFlow() {
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
			title="Set Your Priorities"
			subtitle="Step 1 of 4 — Weight what matters most to you"
			icon={SlidersHorizontal}
			iconClassName="border-teal bg-teal-tint text-teal"
		>
			{/* Category Weighting Cards */}
			<div className="space-y-4">
				{categories.map((cat, i) => {
					const Icon = cat.icon
					const weight = weights[cat.id]
					return (
						<div
							key={cat.id}
							className="border-border bg-card card-institutional p-6"
							style={{ animationDelay: `${(i + 1) * 100}ms` }}
						>
							<div className="mb-4 flex items-start justify-between">
								<div className="flex items-center gap-3">
									<div
										className={`border-${cat.color} bg-${cat.color}-tint flex h-9 w-9 items-center justify-center border`}
									>
										<Icon className={`text-${cat.color} h-4.5 w-4.5`} />
									</div>
									<div>
										<h3 className="font-medium">{cat.label}</h3>
										<p className="text-muted-foreground text-xs">
											{cat.description}
										</p>
									</div>
								</div>
								<span
									className={`data-number border-${cat.color} bg-${cat.color}-tint text-${cat.color} flex h-8 w-8 items-center justify-center border text-sm font-bold`}
								>
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
					to="/consumer/quiz"
					className="btn-primary inline-flex items-center gap-2"
				>
					Continue to Questions
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>
		</FlowPageShell>
	)
}
