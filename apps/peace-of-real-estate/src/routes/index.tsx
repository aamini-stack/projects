import { createFileRoute, Link } from '@tanstack/react-router'
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
	return (
		<div className="flex flex-col">
			{/* Hero Section — Full-width, centered, editorial */}
			<section className="border-border relative border-b">
				<div className="warm-gradient absolute inset-0" />
				<div className="grid-pattern absolute inset-0 opacity-[0.35]" />
				<div className="relative mx-auto max-w-7xl px-6 py-20 text-center md:py-28">
					<h1 className="mx-auto mb-10 max-w-3xl font-serif text-5xl leading-[1.05] font-normal tracking-tight text-balance md:text-6xl lg:text-7xl">
						The most expensive decision
						<br />
						<span className="text-teal-muted">of your life, made right.</span>
					</h1>
					<p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-balance md:text-xl">
						PRE matches consumers with agents based on working style,
						communication expectations, transparency, and fit — not just
						availability.
					</p>
					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Link
							to="/consumer"
							className="btn-primary inline-flex items-center gap-2"
						>
							Find Your Agent
							<ArrowRight className="h-4 w-4" />
						</Link>
						<Link
							to="/agent"
							className="btn-secondary inline-flex items-center gap-2"
						>
							I'm an Agent
							<ArrowUpRight className="h-4 w-4" />
						</Link>
					</div>
				</div>
			</section>

			{/* How It Works — Grid layout */}
			<section className="border-border border-b">
				<div className="mx-auto max-w-5xl px-6 py-20">
					<div className="mb-16 grid gap-8 lg:grid-cols-12">
						<div className="lg:col-span-4">
							<div className="data-label mb-3">01 — Process</div>
							<h2 className="font-serif text-3xl font-normal tracking-tight md:text-4xl">
								How It Works
							</h2>
						</div>
						<div className="lg:col-span-8">
							<p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
								Two journeys, one perfect match. Both sides complete their
								profile, and our bilateral engine finds the fit.
							</p>
						</div>
					</div>

					<div className="grid gap-6 md:grid-cols-2">
						{/* Consumer Card */}
						<div className="bg-card card-institutional p-8 md:p-10">
							<div className="data-label text-teal mb-6">Consumer Journey</div>
							<div className="mb-6 flex items-center gap-4">
								<div className="border-teal bg-teal-tint flex h-10 w-10 items-center justify-center border">
									<Heart className="text-teal h-5 w-5" />
								</div>
								<h3 className="font-serif text-2xl font-normal">
									For Consumers
								</h3>
							</div>
							<p className="text-muted-foreground mb-8 leading-relaxed">
								Answer 16 questions across working style, communication,
								transparency, and fit. Get a ranked list of matched agents.
								Free.
							</p>
							<ul className="mb-8 space-y-3">
								{[
									'Free compatibility assessment',
									'Ranked agent matches',
									'Optional $19.99 AI Deep Dive',
									'Peace Pact transparency',
								].map((item) => (
									<li key={item} className="flex items-center gap-3 text-sm">
										<CheckCircle2 className="text-teal h-4 w-4 shrink-0" />
										<span>{item}</span>
									</li>
								))}
							</ul>
							<Link
								to="/consumer"
								className="btn-primary inline-flex items-center gap-2"
							>
								Start Your Journey
								<ArrowRight className="h-4 w-4" />
							</Link>
						</div>

						{/* Agent Card */}
						<div className="bg-card card-institutional p-8 md:p-10">
							<div className="data-label text-terracotta mb-6">
								Agent Journey
							</div>
							<div className="mb-6 flex items-center gap-4">
								<div className="border-terracotta bg-terracotta-tint flex h-10 w-10 items-center justify-center border">
									<Shield className="text-terracotta h-5 w-5" />
								</div>
								<h3 className="font-serif text-2xl font-normal">For Agents</h3>
							</div>
							<p className="text-muted-foreground mb-8 leading-relaxed">
								Create your profile, complete 12 questions, and get introduced
								to consumers who actually fit how you work. No subscription
								during pilot.
							</p>
							<ul className="mb-8 space-y-3">
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
							<Link
								to="/agent"
								className="btn-primary inline-flex items-center gap-2"
							>
								Join as Agent
								<ArrowRight className="h-4 w-4" />
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Four Pillars — Table-like grid */}
			<section className="border-border border-b">
				<div className="mx-auto max-w-7xl px-6 py-20">
					<div className="mb-16 grid gap-8 lg:grid-cols-12">
						<div className="lg:col-span-4">
							<div className="data-label mb-3">02 — Framework</div>
							<h2 className="font-serif text-3xl font-normal tracking-tight md:text-4xl">
								Built on Transparency
							</h2>
						</div>
						<div className="lg:col-span-8">
							<p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
								Four pillars of a great working relationship. Each dimension is
								weighted and scored bilaterally.
							</p>
						</div>
					</div>

					<div className="bg-border grid gap-px sm:grid-cols-2 lg:grid-cols-4">
						{[
							{
								icon: Heart,
								title: 'Working Style',
								desc: 'How you prefer to work together, from hands-on to hands-off.',
								color: 'teal',
							},
							{
								icon: MessageCircle,
								title: 'Communication',
								desc: 'Frequency, channels, and style that work for both sides.',
								color: 'terracotta',
							},
							{
								icon: Eye,
								title: 'Transparency',
								desc: 'Clear expectations around fees, process, and timeline.',
								color: 'olive',
							},
							{
								icon: Star,
								title: 'Overall Fit',
								desc: 'The holistic chemistry that makes a partnership succeed.',
								color: 'ochre',
							},
						].map((pillar) => {
							const Icon = pillar.icon
							const colorClass = pillar.color as
								| 'teal'
								| 'terracotta'
								| 'olive'
								| 'ochre'
							return (
								<div key={pillar.title} className="bg-card p-8">
									<div
										className={`border-${colorClass} bg-${colorClass}-tint mb-6 flex h-10 w-10 items-center justify-center border`}
									>
										<Icon className={`text-${colorClass} h-5 w-5`} />
									</div>
									<h4 className="mb-3 font-serif text-lg">{pillar.title}</h4>
									<p className="text-muted-foreground text-sm leading-relaxed">
										{pillar.desc}
									</p>
								</div>
							)
						})}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section>
				<div className="mx-auto max-w-7xl px-6 py-20">
					<div className="border-border bg-card card-institutional mx-auto max-w-3xl p-12 md:p-16">
						<div className="text-center">
							<div className="data-label mb-6">Get Started</div>
							<h2 className="mb-6 font-serif text-3xl font-normal tracking-tight md:text-4xl">
								Ready to find your match?
							</h2>
							<p className="text-muted-foreground mx-auto mb-10 max-w-lg leading-relaxed">
								Join the first platform that cares as much about fit as you do
								about finding the right property.
							</p>
							<Link
								to="/consumer"
								className="btn-primary inline-flex items-center gap-2"
							>
								Get Started Free
								<ArrowRight className="h-4 w-4" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</div>
	)
}
