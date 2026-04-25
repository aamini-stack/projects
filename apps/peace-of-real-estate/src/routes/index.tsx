import { authClient } from '@/lib/auth-client'
import { createFileRoute, Link, Navigate } from '@tanstack/react-router'
import {
	ArrowRight,
	Shield,
	MessageCircle,
	Heart,
	Eye,
	Star,
	CheckCircle2,
	ArrowUpRight,
} from 'lucide-react'

export const Route = createFileRoute('/')({
	component: Home,
})

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
			{/* Hero — Editorial, generous whitespace */}
			<section className="relative">
				<div className="relative mx-auto max-w-7xl px-6 pt-24 pb-20 lg:pt-36 lg:pb-28">
					<div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
						{/* Left: Hero text */}
						<div className="lg:col-span-7 xl:col-span-6">
							<div className="mb-8 flex items-center gap-4">
								<div className="accent-line accent-line-sage" />
								<span className="data-label">Peace of Real Estate</span>
							</div>
							<h1 className="mb-8 font-serif text-5xl leading-[1.05] font-normal tracking-tight text-balance sm:text-6xl lg:text-7xl">
								The most expensive decision
								<br className="hidden sm:block" />
								<span className="text-muted-foreground"> of your life, </span>
								<span className="italic">made right.</span>
							</h1>
							<p className="text-muted-foreground mb-12 max-w-lg text-lg leading-relaxed text-balance">
								PRE matches consumers with agents based on working style,
								communication expectations, transparency, and fit — not just
								availability.
							</p>
							<div className="flex flex-col gap-4 sm:flex-row">
								<Link
									to="/consumer/priorities"
									className="btn-primary inline-flex items-center gap-2"
								>
									Find Your Agent
									<ArrowRight className="h-3.5 w-3.5" />
								</Link>
								<Link
									to="/agent/priorities"
									className="btn-secondary inline-flex items-center gap-2"
								>
									I'm an Agent
									<ArrowUpRight className="h-3.5 w-3.5" />
								</Link>
							</div>
						</div>

						{/* Right: Minimal visual element */}
						<div className="hidden lg:col-span-5 lg:flex lg:items-end lg:justify-end xl:col-span-6">
							<div className="relative aspect-[3/4] w-full max-w-md">
								<div className="border-border absolute inset-0 border" />
								<div className="border-border absolute top-6 right-6 bottom-6 left-6 border" />
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="text-center">
										<div className="text-border font-serif text-8xl leading-none font-normal">
											PRE
										</div>
										<div className="mt-4 flex items-center justify-center gap-3">
											<div className="accent-line accent-line-sage" />
											<span className="data-label">Est. 2026</span>
											<div className="accent-line accent-line-terracotta" />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Hairline divider */}
			<div className="mx-auto max-w-7xl px-6">
				<div className="hairline" />
			</div>

			{/* Journey Cards — Editorial layout */}
			<section>
				<div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
					<div className="mb-20 grid gap-8 lg:grid-cols-12">
						<div className="lg:col-span-4">
							<div className="data-label mb-4">Two Journeys</div>
							<h2 className="font-serif text-4xl font-normal tracking-tight">
								Built for both sides
							</h2>
						</div>
						<div className="flex items-end lg:col-span-8">
							<p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
								A bilateral platform where consumers find agents who match their
								working style, and agents meet clients who align with how they
								work.
							</p>
						</div>
					</div>

					<div className="grid gap-6 lg:grid-cols-2">
						{/* Consumer Card */}
						<div className="card-editorial group flex flex-col p-8 lg:p-12">
							<div className="mb-10 flex items-start justify-between">
								<div>
									<div className="data-label text-sage mb-3">
										Consumer Journey
									</div>
									<h3 className="font-serif text-2xl font-normal">
										For Consumers
									</h3>
								</div>
								<div className="border-sage/20 bg-sage-tint flex h-12 w-12 shrink-0 items-center justify-center border">
									<Heart className="text-sage h-5 w-5" />
								</div>
							</div>
							<p className="text-muted-foreground mb-10 text-base leading-relaxed">
								Answer 16 questions across working style, communication,
								transparency, and fit. Get a ranked list of matched agents.
								Free.
							</p>
							<div className="mt-auto">
								<div className="hairline mb-8" />
								<ul className="space-y-4">
									{[
										'Free compatibility assessment',
										'Ranked agent matches',
										'Optional $19.99 AI Deep Dive',
										'Peace Pact transparency',
									].map((item) => (
										<li key={item} className="flex items-center gap-3 text-sm">
											<CheckCircle2 className="text-sage h-4 w-4 shrink-0" />
											<span>{item}</span>
										</li>
									))}
								</ul>
							</div>
						</div>

						{/* Agent Card */}
						<div className="card-editorial group flex flex-col p-8 lg:p-12">
							<div className="mb-10 flex items-start justify-between">
								<div>
									<div className="data-label text-terracotta mb-3">
										Agent Journey
									</div>
									<h3 className="font-serif text-2xl font-normal">
										For Agents
									</h3>
								</div>
								<div className="border-terracotta/20 bg-terracotta-tint flex h-12 w-12 shrink-0 items-center justify-center border">
									<Shield className="text-terracotta h-5 w-5" />
								</div>
							</div>
							<p className="text-muted-foreground mb-10 text-base leading-relaxed">
								Create your profile, complete 12 questions, and get introduced
								to consumers who actually fit how you work. No subscription
								during pilot.
							</p>
							<div className="mt-auto">
								<div className="hairline mb-8" />
								<ul className="space-y-4">
									{[
										'No pilot subscription fee',
										'Pay only on accepted match ($199–$399)',
										'Bilateral fit scoring',
										'Peace Pact signature',
									].map((item) => (
										<li key={item} className="flex items-center gap-3 text-sm">
											<CheckCircle2 className="text-terracotta h-4 w-4 shrink-0" />
											<span>{item}</span>
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Hairline divider */}
			<div className="mx-auto max-w-7xl px-6">
				<div className="hairline" />
			</div>

			{/* Four Pillars — Strict editorial grid */}
			<section>
				<div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
					<div className="mb-20 grid gap-8 lg:grid-cols-12">
						<div className="lg:col-span-4">
							<div className="data-label mb-4">01 — Framework</div>
							<h2 className="font-serif text-4xl font-normal tracking-tight">
								Built on Transparency
							</h2>
						</div>
						<div className="flex items-end lg:col-span-8">
							<p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
								Four pillars of a great working relationship. Each dimension is
								weighted and scored bilaterally.
							</p>
						</div>
					</div>

					<div className="border-border bg-border grid gap-px border sm:grid-cols-2 lg:grid-cols-4">
						{[
							{
								icon: Heart,
								title: 'Working Style',
								desc: 'How you prefer to work together, from hands-on to hands-off.',
								color: 'sage',
								accent: 'Working Style',
							},
							{
								icon: MessageCircle,
								title: 'Communication',
								desc: 'Frequency, channels, and style that work for both sides.',
								color: 'terracotta',
								accent: 'Communication',
							},
							{
								icon: Eye,
								title: 'Transparency',
								desc: 'Clear expectations around fees, process, and timeline.',
								color: 'sand',
								accent: 'Transparency',
							},
							{
								icon: Star,
								title: 'Overall Fit',
								desc: 'The holistic chemistry that makes a partnership succeed.',
								color: 'sage',
								accent: 'Overall Fit',
							},
						].map((pillar) => {
							const Icon = pillar.icon
							return (
								<div
									key={pillar.title}
									className="group bg-card hover:bg-secondary p-8 transition-colors lg:p-10"
								>
									<div className="mb-8">
										<div
											className={`border-${pillar.color}/20 bg-${pillar.color}-tint mb-6 flex h-12 w-12 items-center justify-center border`}
										>
											<Icon className={`text-${pillar.color} h-5 w-5`} />
										</div>
										<div className="data-label mb-3">{pillar.accent}</div>
										<h4 className="font-serif text-xl">{pillar.title}</h4>
									</div>
									<p className="text-muted-foreground text-sm leading-relaxed">
										{pillar.desc}
									</p>
								</div>
							)
						})}
					</div>
				</div>
			</section>

			{/* Hairline divider */}
			<div className="mx-auto max-w-7xl px-6">
				<div className="hairline" />
			</div>

			{/* CTA Section — Minimal editorial */}
			<section>
				<div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
					<div className="mx-auto max-w-2xl text-center">
						<div className="mb-8 flex items-center justify-center gap-4">
							<div className="accent-line accent-line-sage" />
							<span className="data-label">Get Started</span>
							<div className="accent-line accent-line-sand" />
						</div>
						<h2 className="mb-6 font-serif text-4xl font-normal tracking-tight md:text-5xl">
							Ready to find your match?
						</h2>
						<p className="text-muted-foreground mx-auto mb-12 max-w-md leading-relaxed">
							Join the first platform that cares as much about fit as you do
							about finding the right property.
						</p>
						<Link
							to="/consumer/priorities"
							className="btn-primary inline-flex items-center gap-2"
						>
							Get Started Free
							<ArrowRight className="h-3.5 w-3.5" />
						</Link>
					</div>
				</div>
			</section>
		</div>
	)
}
