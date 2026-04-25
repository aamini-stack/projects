import { authClient } from '@/lib/auth-client'
import { createFileRoute, Link, Navigate } from '@tanstack/react-router'
import {
	ArrowRight,
	MessageCircle,
	Heart,
	Eye,
	Star,
	ArrowUpRight,
} from 'lucide-react'
import { useInView } from '@/hooks/use-in-view'
import type { ReactNode } from 'react'

export const Route = createFileRoute('/')({
	component: Home,
})

function Reveal({
	children,
	delay = 0,
	className = '',
}: {
	children: ReactNode
	delay?: number
	className?: string
}) {
	const { ref, isInView } = useInView()
	return (
		<div
			ref={ref}
			className={`reveal ${isInView ? 'is-visible' : ''} ${className}`}
			style={{ transitionDelay: `${delay}ms` }}
		>
			{children}
		</div>
	)
}

function Home() {
	const { data: session, isPending } = authClient.useSession()

	if (isPending) {
		return <div className="flex-1" />
	}

	if (session) {
		return <Navigate to="/match-activity" />
	}

	return (
		<div className="flex flex-col">
			{/* Hero */}
			<section className="grain relative flex min-h-[90vh] flex-col items-center justify-center px-6 py-24 text-center lg:min-h-screen">
				<div className="absolute inset-0 z-0 bg-gradient-to-b from-background via-[#EDEAE2] to-background" />
				<div className="relative z-10 mx-auto max-w-4xl">
					<Reveal>
						<p className="data-label text-accent mb-8">
							Bilateral Matching Platform
						</p>
					</Reveal>
					<Reveal delay={100}>
						<h1 className="font-serif mb-8 text-[clamp(2.5rem,6.5vw,5.5rem)] font-light leading-[1.05] tracking-tight text-balance">
							The most expensive decision
							<br />
							of your life,{' '}
							<em
								className="text-muted-foreground not-italic"
								style={{ fontStyle: 'italic' }}
							>
								made right.
							</em>
						</h1>
					</Reveal>
					<Reveal delay={200}>
						<p className="text-muted-foreground mx-auto mb-12 max-w-lg text-base leading-relaxed text-balance sm:text-lg">
							PRE matches consumers with agents based on working style,
							communication expectations, transparency, and fit — not just
							availability.
						</p>
					</Reveal>
					<Reveal delay={300}>
						<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
							<Link
								to="/consumer/priorities"
								className="btn-elegant-filled inline-flex items-center gap-3"
							>
								Find Your Agent
								<ArrowRight className="h-3.5 w-3.5" />
							</Link>
							<Link
								to="/agent/priorities"
								className="btn-elegant inline-flex items-center gap-3"
							>
								I'm an Agent
								<ArrowUpRight className="h-3.5 w-3.5" />
							</Link>
						</div>
					</Reveal>
				</div>
			</section>

			{/* Journey Sections */}
			<section className="border-border border-t">
				<div className="mx-auto grid max-w-7xl lg:grid-cols-2">
					{/* Consumer */}
					<div className="relative px-6 py-20 lg:py-32 lg:pr-20">
						<div className="absolute right-0 top-0 hidden h-full w-px bg-border lg:block" />
						<div className="data-label text-accent mb-6">Consumer Journey</div>
						<div className="font-serif text-muted mb-8 text-[clamp(4rem,10vw,8rem)] font-light leading-none tracking-tighter">
							01
						</div>
						<h3 className="font-serif mb-6 text-2xl font-normal tracking-tight">
							For Consumers
						</h3>
						<p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
							Answer 16 questions across working style, communication,
							transparency, and fit. Get a ranked list of matched agents.
							Free.
						</p>
						<ul className="space-y-3">
							{[
								'Free compatibility assessment',
								'Ranked agent matches',
								'Optional $19.99 AI Deep Dive',
								'Peace Pact transparency',
							].map((item) => (
								<li
									key={item}
									className="flex items-center gap-3 text-sm"
								>
									<span className="bg-foreground h-[5px] w-[5px] shrink-0 rounded-full" />
									<span>{item}</span>
								</li>
							))}
						</ul>
					</div>

					{/* Agent */}
					<div className="relative border-t border-border px-6 py-20 lg:border-t-0 lg:py-32 lg:pl-20">
						<div className="data-label text-accent mb-6">Agent Journey</div>
						<div className="font-serif text-muted mb-8 text-[clamp(4rem,10vw,8rem)] font-light leading-none tracking-tighter">
							02
						</div>
						<h3 className="font-serif mb-6 text-2xl font-normal tracking-tight">
							For Agents
						</h3>
						<p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
							Create your profile, complete 12 questions, and get introduced
							to consumers who actually fit how you work. No subscription
							during pilot.
						</p>
						<ul className="space-y-3">
							{[
								'No pilot subscription fee',
								'Pay only on accepted match ($199–$399)',
								'Bilateral fit scoring',
								'Peace Pact signature',
							].map((item) => (
								<li
									key={item}
									className="flex items-center gap-3 text-sm"
								>
									<span className="bg-foreground h-[5px] w-[5px] shrink-0 rounded-full" />
									<span>{item}</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			</section>

			{/* Four Pillars */}
			<section className="border-border bg-[#EDEAE2] border-t">
				<div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
					<div className="mb-20 text-center">
						<div className="data-label mb-4">01 — Framework</div>
						<h2 className="font-serif text-4xl font-light tracking-tight md:text-5xl">
							Built on Transparency
						</h2>
						<p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
							Four pillars of a great working relationship. Each dimension is
							weighted and scored bilaterally.
						</p>
					</div>

					<div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
						{[
							{
								icon: Heart,
								title: 'Working Style',
								desc: 'How you prefer to work together, from hands-on to hands-off.',
							},
							{
								icon: MessageCircle,
								title: 'Communication',
								desc: 'Frequency, channels, and style that work for both sides.',
							},
							{
								icon: Eye,
								title: 'Transparency',
								desc: 'Clear expectations around fees, process, and timeline.',
							},
							{
								icon: Star,
								title: 'Overall Fit',
								desc: 'The holistic chemistry that makes a partnership succeed.',
							},
						].map((pillar) => {
							const Icon = pillar.icon
							return (
								<div
									key={pillar.title}
									className="bg-background p-8 lg:p-10"
								>
									<div className="mb-8 flex h-10 w-10 items-center justify-center border border-border">
										<Icon
											className="text-muted-foreground h-4 w-4"
											strokeWidth={1.5}
										/>
									</div>
									<div className="hairline mb-6" />
									<h4 className="font-serif mb-3 text-xl">
										{pillar.title}
									</h4>
									<p className="text-muted-foreground text-sm leading-relaxed">
										{pillar.desc}
									</p>
								</div>
							)
						})}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="relative">
				<div className="divider-bronze absolute top-0 right-0 left-0" />
				<div className="mx-auto max-w-3xl px-6 py-24 text-center lg:py-32">
					<div className="data-label mb-8">Get Started</div>
					<h2 className="font-serif mb-8 text-4xl font-light tracking-tight md:text-5xl">
						Ready to find your match?
					</h2>
					<p className="text-muted-foreground mx-auto mb-12 max-w-lg leading-relaxed">
						Join the first platform that cares as much about fit as you do
						about finding the right property.
					</p>
					<Link
						to="/consumer/priorities"
						className="btn-elegant-filled inline-flex items-center gap-3"
					>
						Get Started Free
						<ArrowRight className="h-3.5 w-3.5" />
					</Link>
				</div>
			</section>
		</div>
	)
}
