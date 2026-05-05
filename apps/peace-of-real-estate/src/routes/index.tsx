import { authClient } from '@/lib/auth-client'
import { WavyBackground } from '@/components/wavy-background'
import { createFileRoute, Link, Navigate } from '@tanstack/react-router'
import {
	ArrowRight,
	Shield,
	MessageCircle,
	Heart,
	Home as HomeIcon,
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
			<section className="border-border relative overflow-hidden border-b">
				<WavyBackground />
				<div className="absolute inset-0 bg-white/80 backdrop-blur-[2px]" />
				<div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
					<div className="grid items-start gap-10 xl:grid-cols-2 xl:gap-16">
						<div className="flex flex-col justify-center pt-2 xl:pt-8">
							<div className="data-label text-navy mb-5">
								Bilateral Agent Matching
							</div>
							<h1 className="font-heading mb-8 text-4xl leading-[1.05] font-normal tracking-tight text-balance sm:text-5xl lg:text-6xl">
								The most expensive decision
								<br />
								of your life, <span className="text-navy">made right.</span>
							</h1>
							<p className="text-muted-foreground mb-10 max-w-xl text-lg leading-relaxed text-balance">
								PRE matches buyers, sellers, and agents based on working style,
								communication expectations, transparency, and fit — not just
								availability.
							</p>
							<div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
								<Link
									to="/buyer/intro"
									className="btn-primary inline-flex items-center gap-2"
								>
									I'm a Buyer
									<ArrowRight className="h-4 w-4" />
								</Link>
								<Link
									to="/seller/intro"
									className="btn-secondary !bg-background inline-flex items-center gap-2"
								>
									I'm a Seller
									<HomeIcon className="h-4 w-4" />
								</Link>
								<Link
									to="/agent/priorities"
									className="btn-secondary !bg-background inline-flex items-center gap-2"
								>
									I'm an Agent
									<ArrowUpRight className="h-4 w-4" />
								</Link>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 xl:gap-5">
							<div className="border-border shadow-card flex flex-col rounded-2xl border bg-white p-6 xl:p-8">
								<div className="data-label text-navy mb-4">
									Consumer Journey
								</div>
								<div className="mb-4 flex items-center gap-3">
									<div className="border-navy/20 bg-navy-tint flex h-10 w-10 items-center justify-center rounded-full border">
										<Heart className="text-navy h-4 w-4" />
									</div>
									<h3 className="font-heading text-xl font-normal">
										For Buyers
									</h3>
								</div>
								<p className="text-muted-foreground mb-6 text-sm leading-relaxed">
									Share your search area, buying intent, and fit preferences.
									Unlock verified matches for a one-time $19.99 fee.
								</p>
								<ul className="space-y-2">
									{[
										'Free fit snapshot',
										'Ranked buyer-agent matches',
										'Optional Pax deep dive',
										'Peace Pact transparency',
									].map((item) => (
										<li key={item} className="flex items-center gap-2 text-sm">
											<CheckCircle2 className="text-navy h-4 w-4 shrink-0" />
											<span>{item}</span>
										</li>
									))}
								</ul>
							</div>

							<div className="border-border shadow-card flex flex-col rounded-2xl border bg-white p-6 xl:p-8">
								<div className="data-label text-navy mb-4">Seller Journey</div>
								<div className="mb-4 flex items-center gap-3">
									<div className="border-navy/20 bg-navy-tint flex h-10 w-10 items-center justify-center rounded-full border">
										<HomeIcon className="text-navy h-4 w-4" />
									</div>
									<h3 className="font-heading text-xl font-normal">
										For Sellers
									</h3>
								</div>
								<p className="text-muted-foreground mb-6 text-sm leading-relaxed">
									Start with property area and selling intent. Get matched with
									listing agents who fit your timeline, communication style, and
									commission expectations.
								</p>
								<ul className="space-y-2">
									{[
										'Seller-specific fit questions',
										'Ranked listing-agent matches',
										'Pax seller prep',
										'Offer-compensation reminder',
									].map((item) => (
										<li key={item} className="flex items-center gap-2 text-sm">
											<CheckCircle2 className="text-navy h-4 w-4 shrink-0" />
											<span>{item}</span>
										</li>
									))}
								</ul>
							</div>

							<div className="border-border shadow-card flex flex-col rounded-2xl border bg-white p-6 xl:p-8">
								<div className="data-label text-amber mb-4">Agent Journey</div>
								<div className="mb-4 flex items-center gap-3">
									<div className="border-amber/30 bg-amber-tint flex h-10 w-10 items-center justify-center rounded-full border">
										<Shield className="text-amber h-4 w-4" />
									</div>
									<h3 className="font-heading text-xl font-normal">
										For Agents
									</h3>
								</div>
								<p className="text-muted-foreground mb-6 text-sm leading-relaxed">
									Create your profile, complete verification, sign the Peace
									Pact, and subscribe to receive pre-matched introductions.
								</p>
								<ul className="space-y-2">
									{[
										'$99 / month profile visibility',
										'Pay only on accepted match ($199–$399)',
										'Bilateral fit scoring',
										'Peace Pact signature',
									].map((item) => (
										<li key={item} className="flex items-center gap-2 text-sm">
											<CheckCircle2 className="text-amber h-4 w-4 shrink-0" />
											<span>{item}</span>
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="border-border border-b">
				<div className="mx-auto max-w-7xl px-6 py-20">
					<div className="mb-16 grid gap-8 lg:grid-cols-12">
						<div className="lg:col-span-4">
							<div className="data-label mb-3">01 — Framework</div>
							<h2 className="font-heading text-3xl font-normal tracking-tight md:text-4xl">
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

					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{[
							{
								icon: Heart,
								title: 'Working Style',
								desc: 'How you prefer to work together, from hands-on to hands-off.',
								color: 'navy',
							},
							{
								icon: MessageCircle,
								title: 'Communication',
								desc: 'Frequency, channels, and style that work for both sides.',
								color: 'amber',
							},
							{
								icon: Eye,
								title: 'Transparency',
								desc: 'Clear expectations around fees, process, and timeline.',
								color: 'success',
							},
							{
								icon: Star,
								title: 'Overall Fit',
								desc: 'The holistic chemistry that makes a partnership succeed.',
								color: 'warning',
							},
						].map((pillar) => {
							const Icon = pillar.icon
							const colorClass = pillar.color as
								| 'navy'
								| 'amber'
								| 'success'
								| 'warning'
							return (
								<div key={pillar.title} className="soft-panel p-8">
									<div
										className={`border-${colorClass} bg-${colorClass}-tint mb-6 flex h-11 w-11 items-center justify-center rounded-full border`}
									>
										<Icon className={`text-${colorClass} h-5 w-5`} />
									</div>
									<h4 className="font-heading mb-3 text-lg">{pillar.title}</h4>
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
					<div className="soft-panel mx-auto max-w-3xl p-12 md:p-16">
						<div className="text-center">
							<div className="data-label mb-6">Get Started</div>
							<h2 className="font-heading mb-6 text-3xl font-normal tracking-tight md:text-4xl">
								Ready to find your match?
							</h2>
							<p className="text-muted-foreground mx-auto mb-10 max-w-lg leading-relaxed">
								Join the first platform that cares as much about fit as you do
								about finding the right property.
							</p>
							<Link
								to="/buyer/intro"
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
