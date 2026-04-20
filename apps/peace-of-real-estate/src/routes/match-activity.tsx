import { createFileRoute, Link } from '@tanstack/react-router'
import {
	ArrowLeft,
	Users,
	ArrowRightLeft,
	CheckCircle2,
	Star,
	TrendingUp,
} from 'lucide-react'

export const Route = createFileRoute('/match-activity')({
	component: MatchActivityPage,
})

const recentMatches = [
	{
		id: 1,
		consumer: 'Alex M.',
		agent: 'Sarah Chen',
		score: 4.8,
		status: 'Introduction sent',
		date: '2 hours ago',
	},
	{
		id: 2,
		consumer: 'Jordan K.',
		agent: 'Marcus Johnson',
		score: 4.5,
		status: 'Agent accepted',
		date: '5 hours ago',
	},
	{
		id: 3,
		consumer: 'Taylor R.',
		agent: 'Elena Rodriguez',
		score: 4.3,
		status: 'Pending acceptance',
		date: '1 day ago',
	},
]

const stats = [
	{ label: 'Total Matches', value: '1,247', icon: Users },
	{ label: 'Avg Fit Score', value: '4.4', icon: Star },
	{ label: 'Success Rate', value: '89%', icon: TrendingUp },
	{ label: 'Active Today', value: '23', icon: ArrowRightLeft },
]

function MatchActivityPage() {
	return (
		<div className="mx-auto max-w-5xl px-6 py-12">
			<div className="mb-10">
				<Link
					to="/"
					className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to home
				</Link>
				<div className="hairline mb-6" />
				<div className="flex items-center gap-4">
					<div className="border-border flex h-10 w-10 items-center justify-center border">
						<ArrowRightLeft className="h-5 w-5" />
					</div>
					<div>
						<div className="data-label mb-1">Public Feed</div>
						<h1 className="font-serif text-2xl font-normal tracking-tight">
							Match Activity
						</h1>
					</div>
				</div>
			</div>

			<div className="bg-border mb-10 grid gap-px sm:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat, i) => {
					const Icon = stat.icon
					return (
						<div
							key={stat.label}
							className="bg-card p-6"
							style={{ animationDelay: `${(i + 1) * 100}ms` }}
						>
							<Icon className="text-ochre mb-3 h-5 w-5" />
							<div className="data-number font-serif text-2xl">
								{stat.value}
							</div>
							<div className="text-muted-foreground text-xs">{stat.label}</div>
						</div>
					)
				})}
			</div>

			<div className="border-border bg-card card-institutional p-8">
				<div className="mb-6 flex items-center justify-between">
					<h2 className="font-serif text-lg">Recent Introductions</h2>
					<span className="data-label">Live feed</span>
				</div>

				<div className="bg-border space-y-px">
					{recentMatches.map((match) => (
						<div
							key={match.id}
							className="bg-card hover:bg-secondary flex items-center gap-4 p-4 transition-colors"
						>
							<div className="data-number border-ochre bg-ochre-tint text-ochre flex h-10 w-10 shrink-0 items-center justify-center border text-sm font-bold">
								{match.score.toFixed(1)}
							</div>

							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2 text-sm">
									<span className="truncate font-medium">{match.consumer}</span>
									<span className="text-muted-foreground">↔</span>
									<span className="truncate font-medium">{match.agent}</span>
								</div>
								<div className="text-muted-foreground mt-0.5 text-xs">
									{match.date}
								</div>
							</div>

							<div className="flex shrink-0 items-center gap-2">
								<CheckCircle2 className="text-olive h-3.5 w-3.5" />
								<span className="text-xs">{match.status}</span>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="border-border bg-card card-institutional mt-10 p-8">
				<div className="data-label mb-6">Process Overview</div>
				<h2 className="mb-8 font-serif text-lg">
					How Bilateral Matching Works
				</h2>
				<div className="grid gap-8 md:grid-cols-3">
					{[
						{
							step: '01',
							title: 'Both sides complete profiles',
							desc: 'Consumers and agents each answer questions and set priority weights.',
							color: 'teal',
						},
						{
							step: '02',
							title: 'Engine calculates fit',
							desc: 'Our algorithm compares responses across all four categories to find alignment.',
							color: 'terracotta',
						},
						{
							step: '03',
							title: 'Ranked matches revealed',
							desc: 'Consumers see ranked agents. Agents review and accept introductions.',
							color: 'olive',
						},
					].map((item) => (
						<div key={item.step}>
							<div
								className={`data-number border-${item.color} bg-${item.color}-tint text-${item.color} mb-4 flex h-10 w-10 items-center justify-center border text-sm font-bold`}
							>
								{item.step}
							</div>
							<h3 className="mb-2 font-medium">{item.title}</h3>
							<p className="text-muted-foreground text-sm">{item.desc}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
