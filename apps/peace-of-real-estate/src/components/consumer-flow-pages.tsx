import { Link, Navigate } from '@tanstack/react-router'
import {
	ArrowLeft,
	ArrowRight,
	Bot,
	CheckCircle2,
	CreditCard,
	Mail,
	MapPin,
	MessageCircle,
	Sparkles,
	Trophy,
} from 'lucide-react'
import { useState } from 'react'

import { AgentMatchCard, type AgentMatch } from '@/components/agent-match-card'
import { FlowPageShell } from '@/components/flow-page-shell'
import { QuestionFlow } from '@/components/question-flow'
import {
	getNextUnansweredQuestionIndex,
	getStoredConsumerDraftForFlow,
	saveStoredConsumerDraftForFlow,
} from '@/lib/intake-draft'
import { buyerQuestionFlow, sellerQuestionFlow } from '@/lib/questions'
import type { ConsumerFlowKind } from '@/lib/user-settings'

type ConsumerFlowConfig = {
	kind: ConsumerFlowKind
	basePath: '/buyer' | '/seller'
	label: 'Buyer' | 'Seller'
	areaPrompt: string
	intentOptions: string[]
	questionFlow: typeof buyerQuestionFlow
	accent: 'navy' | 'amber'
}

export const buyerConfig = {
	kind: 'buyer',
	basePath: '/buyer',
	label: 'Buyer',
	areaPrompt: 'In what area(s) are you searching?',
	intentOptions: [
		'I am ready to buy a home',
		'I am starting to explore what is out there',
		'I am selling my home first and then buying next',
	],
	questionFlow: buyerQuestionFlow,
	accent: 'navy',
} satisfies ConsumerFlowConfig

export const sellerConfig = {
	kind: 'seller',
	basePath: '/seller',
	label: 'Seller',
	areaPrompt: 'In what area is your property located?',
	intentOptions: [
		'I am ready to sell my home',
		'I am starting to explore what selling looks like',
		'I am selling first, then buying',
	],
	questionFlow: sellerQuestionFlow,
	accent: 'amber',
} satisfies ConsumerFlowConfig

const consumerMatches: AgentMatch[] = [
	{
		id: 1,
		name: 'Sarah Chen',
		agency: 'Horizon Realty Group',
		location: 'Austin, TX',
		overall: 4.8,
		scores: {
			'Working Style': 4.9,
			Communication: 4.7,
			Transparency: 4.8,
			Fit: 4.9,
		},
		experience: '12 years',
		specialties: ['First-time buyers', 'Luxury homes', 'Calm negotiation'],
		about:
			'Known for patient guidance and transparent communication. Strong fit for clients who want a steady, low-pressure process.',
		topMatch: true,
	},
	{
		id: 2,
		name: 'Marcus Johnson',
		agency: 'Urban Nest Properties',
		location: 'Austin, TX',
		overall: 4.5,
		scores: {
			'Working Style': 4.6,
			Communication: 4.4,
			Transparency: 4.5,
			Fit: 4.4,
		},
		experience: '8 years',
		specialties: ['Fast timelines', 'Urban properties', 'Relocation'],
		about:
			'Efficient, data-driven agent who respects your time and keeps decisions moving without extra drama.',
		topMatch: false,
	},
]

export function ConsumerIndex({ config }: { config: ConsumerFlowConfig }) {
	return <Navigate to={`${config.basePath}/intro`} />
}

export function ConsumerIntro({ config }: { config: ConsumerFlowConfig }) {
	const draft = getStoredConsumerDraftForFlow(config.kind)
	const [zipCode, setZipCode] = useState(draft.zipCode ?? '')
	const [intent, setIntent] = useState(draft.intent ?? '')
	const canContinue = zipCode.trim().length >= 5 && intent.length > 0

	return (
		<FlowPageShell
			backTo="/"
			backLabel="Back to home"
			title={`${config.label} Fit Intake`}
			subtitle="Step 1 — Area and intent"
			icon={MapPin}
			iconClassName="border-navy bg-navy-tint text-navy"
		>
			<label htmlFor={`${config.kind}-zip`} className="text-sm font-medium">
				{config.areaPrompt}
			</label>
			<input
				id={`${config.kind}-zip`}
				value={zipCode}
				onChange={(event) => setZipCode(event.target.value)}
				placeholder="Zip code"
				className="border-border bg-background focus:border-primary mt-3 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none"
			/>

			<div className="mt-8 space-y-3">
				{config.intentOptions.map((option) => (
					<button
						key={option}
						type="button"
						onClick={() => setIntent(option)}
						className={`w-full rounded-xl border p-4 text-left text-sm transition-all ${
							intent === option
								? 'border-navy bg-navy-tint text-foreground'
								: 'border-border hover:border-navy/30 hover:bg-secondary'
						}`}
					>
						{option}
					</button>
				))}
			</div>

			<div className="mt-10 flex items-center justify-between">
				<Link
					to="/"
					className="text-muted-foreground inline-flex items-center gap-2 text-sm"
				>
					<ArrowLeft className="h-4 w-4" />
					Back
				</Link>
				<Link
					to={`${config.basePath}/email`}
					onClick={() => {
						saveStoredConsumerDraftForFlow(config.kind, { zipCode, intent })
					}}
					className={`${canContinue ? 'btn-primary' : 'bg-muted text-muted-foreground pointer-events-none'} inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium`}
				>
					Find My PRE Match
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>
		</FlowPageShell>
	)
}

export function ConsumerEmail({ config }: { config: ConsumerFlowConfig }) {
	const draft = getStoredConsumerDraftForFlow(config.kind)
	const [email, setEmail] = useState(draft.email ?? '')

	const saveEmail = () => saveStoredConsumerDraftForFlow(config.kind, { email })

	return (
		<FlowPageShell
			backTo={`${config.basePath}/intro`}
			backLabel="Back"
			title="Free Fit Snapshot"
			subtitle="Step 2 — Delivery"
			icon={Mail}
			iconClassName="border-navy bg-navy-tint text-navy"
		>
			<h2 className="font-heading text-2xl font-normal tracking-tight">
				Where should we send your free fit snapshot?
			</h2>
			<p className="text-muted-foreground mt-3 text-sm leading-relaxed">
				We'll email your fit snapshot. No fee. No subscription.
			</p>
			<input
				value={email}
				onChange={(event) => setEmail(event.target.value)}
				placeholder="you@example.com"
				type="email"
				className="border-border bg-background focus:border-primary mt-8 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none"
			/>
			<div className="mt-10 flex flex-wrap items-center justify-between gap-3">
				<Link
					to={`${config.basePath}/quiz`}
					onClick={saveEmail}
					className="btn-primary inline-flex items-center gap-2"
				>
					Continue
					<ArrowRight className="h-4 w-4" />
				</Link>
				<Link
					to={`${config.basePath}/quiz`}
					onClick={() =>
						saveStoredConsumerDraftForFlow(config.kind, { email: '' })
					}
					className="text-muted-foreground hover:text-foreground text-sm transition-colors"
				>
					Skip for now
				</Link>
			</div>
		</FlowPageShell>
	)
}

export function ConsumerQuiz({ config }: { config: ConsumerFlowConfig }) {
	const draft = getStoredConsumerDraftForFlow(config.kind)
	const accentClassName = config.accent === 'navy' ? 'bg-navy' : 'bg-amber'
	const accentTextClassName =
		config.accent === 'navy' ? 'text-navy' : 'text-amber'
	const accentTintClassName =
		config.accent === 'navy' ? 'bg-navy-tint' : 'bg-amber-tint'

	return (
		<QuestionFlow
			backTo={`${config.basePath}/email`}
			backLabel="Back"
			stepLabel="Step 3 — Core fit questions"
			accentClassName={accentClassName}
			accentTextClassName={accentTextClassName}
			accentTintClassName={accentTintClassName}
			accentHoverBorderClassName={
				config.accent === 'navy'
					? 'hover:border-navy/30'
					: 'hover:border-amber/30'
			}
			questions={config.questionFlow.questions}
			initialAnswers={draft.answers}
			initialQuestionIndex={getNextUnansweredQuestionIndex(
				config.questionFlow.questions,
				draft.answers,
			)}
			onAnswersChange={(answers) =>
				saveStoredConsumerDraftForFlow(config.kind, { answers })
			}
			completeTo={`${config.basePath}/details`}
			completeLabel="Continue"
		/>
	)
}

export function ConsumerDetails({ config }: { config: ConsumerFlowConfig }) {
	const draft = getStoredConsumerDraftForFlow(config.kind)
	const [matchDetails, setMatchDetails] = useState(draft.matchDetails ?? '')

	return (
		<FlowPageShell
			backTo={`${config.basePath}/quiz`}
			backLabel="Back to questions"
			title="Situation Details"
			subtitle="Optional — more context improves fit"
			icon={MessageCircle}
			iconClassName="border-navy bg-navy-tint text-navy"
		>
			<label
				htmlFor={`${config.kind}-details`}
				className="font-heading text-xl leading-relaxed font-normal"
			>
				Is there anything about your situation that would help us find a better
				match?
			</label>
			<p className="text-muted-foreground mt-2 text-sm">
				Optional — the more you share, the better we can match you.
			</p>
			<textarea
				id={`${config.kind}-details`}
				value={matchDetails}
				onChange={(event) => setMatchDetails(event.target.value)}
				rows={7}
				placeholder="Timing, concerns, must-haves, constraints, or anything Pax should understand."
				className="border-border bg-background focus:border-primary mt-6 w-full rounded-xl border px-4 py-3 text-sm leading-relaxed focus:outline-none"
			/>
			<div className="mt-10 flex justify-end">
				<Link
					to={`${config.basePath}/summary`}
					onClick={() =>
						saveStoredConsumerDraftForFlow(config.kind, { matchDetails })
					}
					className="btn-primary inline-flex items-center gap-2"
				>
					View Fit Summary
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>
		</FlowPageShell>
	)
}

export function ConsumerSummary({ config }: { config: ConsumerFlowConfig }) {
	return (
		<FlowPageShell
			backTo={`${config.basePath}/details`}
			backLabel="Back"
			title="Your Fit Summary"
			subtitle="Free snapshot"
			icon={Sparkles}
			iconClassName="border-navy bg-navy-tint text-navy"
		>
			<div className="space-y-4">
				{[
					'You prefer clear expectations before big decisions.',
					'Communication fit matters as much as market knowledge.',
					'PRE will rank agents by fit, not by ad spend or lead buying.',
				].map((item) => (
					<div
						key={item}
						className="border-border bg-background flex gap-3 rounded-xl border p-4 text-sm"
					>
						<CheckCircle2 className="text-navy mt-0.5 h-4 w-4 shrink-0" />
						<span>{item}</span>
					</div>
				))}
			</div>
			<div className="mt-10 flex justify-end">
				<Link
					to={`${config.basePath}/unlock`}
					className="btn-primary inline-flex items-center gap-2"
				>
					Continue
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>
		</FlowPageShell>
	)
}

export function ConsumerUnlock({ config }: { config: ConsumerFlowConfig }) {
	return (
		<FlowPageShell
			backTo={`${config.basePath}/summary`}
			backLabel="Review summary"
			title="Unlock Matches"
			subtitle="One-time verified results"
			icon={CreditCard}
			iconClassName="border-navy bg-navy-tint text-navy"
		>
			<div className="text-center">
				<div className="data-label text-navy mb-4">UNLOCK MATCHES</div>
				<h2 className="font-heading text-3xl font-normal tracking-tight">
					Meet the agent who actually fits you.
				</h2>
				<div className="data-number text-navy mt-8 text-5xl">$19.99</div>
				<p className="text-muted-foreground mt-3 text-sm">
					One-time fee · No subscription · 100% refundable if no match
				</p>
				<div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
					<Link
						to={`${config.basePath}/chat`}
						className="btn-primary inline-flex items-center justify-center gap-2"
					>
						Unlock My Matches — $19.99
						<ArrowRight className="h-4 w-4" />
					</Link>
					<Link
						to={`${config.basePath}/summary`}
						className="btn-secondary inline-flex items-center justify-center"
					>
						Review my Fit Summary first
					</Link>
				</div>
			</div>
		</FlowPageShell>
	)
}

export function ConsumerChat({ config }: { config: ConsumerFlowConfig }) {
	return (
		<FlowPageShell
			backTo={`${config.basePath}/unlock`}
			backLabel="Back"
			title="Pax"
			subtitle="Your Matching Guide"
			icon={Bot}
			iconClassName="border-navy bg-navy-tint text-navy"
		>
			<div className="border-border bg-background rounded-2xl border p-5 text-sm leading-relaxed">
				Hi, I'm Pax — your guide here on PRE. Pax means peace in Latin. I can
				ask a few follow-up questions to deepen your match profile before
				results.
			</div>
			<textarea
				placeholder="Type your answer..."
				rows={5}
				className="border-border bg-background focus:border-primary mt-4 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none"
			/>
			<div className="mt-8 flex flex-wrap items-center justify-between gap-3">
				<Link
					to={`${config.basePath}/results`}
					className="btn-primary inline-flex items-center gap-2"
				>
					Generate My Matches
					<ArrowRight className="h-4 w-4" />
				</Link>
				<Link
					to={`${config.basePath}/results`}
					className="text-muted-foreground hover:text-foreground text-sm"
				>
					Skip for now
				</Link>
			</div>
		</FlowPageShell>
	)
}

export function ConsumerResults({ config }: { config: ConsumerFlowConfig }) {
	return (
		<FlowPageShell
			backTo={`${config.basePath}/chat`}
			backLabel="Back"
			title="Your Top Matches"
			subtitle="Real agents ranked by fit"
			icon={Trophy}
			iconClassName="border-navy bg-navy-tint text-navy"
		>
			<p className="text-muted-foreground mb-6 text-center text-sm leading-relaxed">
				Real agents ranked by fit — not by who paid the most to get your contact
				info. You can select up to 3 agents total.
			</p>
			<div className="space-y-4">
				{consumerMatches.map((match, index) => (
					<AgentMatchCard key={match.id} match={match} index={index} />
				))}
			</div>
			{config.kind === 'seller' ? (
				<p className="text-muted-foreground border-amber/30 bg-amber-tint mt-6 rounded-xl border p-4 text-sm">
					Seller tip: Always request that buyer agent compensation is submitted
					with the offer — not agreed to upfront.
				</p>
			) : null}
		</FlowPageShell>
	)
}
