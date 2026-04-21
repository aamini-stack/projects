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
		color: 'blue-cyan',
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
			iconClassName="border-blue-cyan bg-blue-cyan-tint text-blue-cyan"
		>
			{/* Category Weighting */}
			<div className="space-y-6">
				{categories.map((cat, i) => {
					const Icon = cat.icon
					const weight = weights[cat.id] ?? 3
					return (
						<div key={cat.id} style={{ animationDelay: `${(i + 1) * 100}ms` }}>
							<div className="mb-3 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Icon
										className={`text-${cat.color} h-6 w-6 transition-all duration-300`}
										style={{
											filter:
												cat.color === 'ochre'
													? `brightness(${0.4 + weight * 0.12}) saturate(${0.6 + weight * 0.4})`
													: cat.color === 'olive'
														? `brightness(${0.5 + weight * 0.4}) saturate(${0.4 + weight * 0.6})`
														: `brightness(${0.5 + weight * 0.3}) saturate(${0.6 + weight * 0.4})`,
											opacity:
												cat.color === 'olive'
													? 0.5 + weight * 0.22
													: 0.5 + weight * 0.125,
										}}
									/>
									<div>
										<h3 className="text-sm font-medium">{cat.label}</h3>
										<p className="text-muted-foreground text-xs">
											{cat.description}
										</p>
									</div>
								</div>
								<span
									className={`data-number text-${cat.color} text-sm font-bold`}
									style={{
										filter:
											cat.color === 'ochre'
												? `brightness(${0.4 + weight * 0.12}) saturate(${0.6 + weight * 0.4})`
												: cat.color === 'olive'
													? `brightness(${0.5 + weight * 0.4}) saturate(${0.4 + weight * 0.6})`
													: `brightness(${0.5 + weight * 0.3}) saturate(${0.6 + weight * 0.4})`,
										opacity:
											cat.color === 'olive'
												? 0.5 + weight * 0.22
												: 0.5 + weight * 0.125,
									}}
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
