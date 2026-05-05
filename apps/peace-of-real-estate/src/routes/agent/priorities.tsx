import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Briefcase, CheckCircle2, Shield } from 'lucide-react'
import { useState } from 'react'

import { FlowPageShell } from '@/components/flow-page-shell'
import {
	getStoredIntakeDraftForRole,
	saveStoredIntakeDraftForRole,
} from '@/lib/intake-draft'

export const Route = createFileRoute('/agent/priorities')({
	component: AgentPriorities,
})

function AgentPriorities() {
	const draft = getStoredIntakeDraftForRole('agent')
	const [representation, setRepresentation] = useState(
		draft.agentRepresentation ?? '',
	)

	return (
		<FlowPageShell
			backTo="/"
			backLabel="Back to home"
			title="Tell Us About Yourself"
			subtitle="Agent onboarding — profile, verification, Pax"
			icon={Shield}
			iconClassName="border-amber bg-amber-tint text-amber"
		>
			<p className="text-muted-foreground text-sm leading-relaxed">
				Answer questions about your working style, communication preferences,
				and transaction approach. Then we'll verify your license, collect your
				contact details, and capture what makes you stand out to clients.
			</p>

			<div className="mt-8 grid gap-3 sm:grid-cols-2">
				{['Buyer representation', 'Seller representation'].map((option) => (
					<button
						key={option}
						type="button"
						onClick={() => setRepresentation(option)}
						className={`rounded-xl border p-4 text-left text-sm transition-all ${
							representation === option
								? 'border-amber bg-amber-tint text-foreground'
								: 'border-border hover:border-amber/40 hover:bg-secondary'
						}`}
					>
						<Briefcase className="text-amber mb-3 h-4 w-4" />
						{option}
					</button>
				))}
			</div>

			<div className="border-border bg-background mt-8 rounded-2xl border p-5">
				<h2 className="font-heading text-xl font-normal">
					Here's how it works — and what it costs.
				</h2>
				<p className="text-muted-foreground mt-2 text-sm leading-relaxed">
					PRE connects agents with pre-matched consumers who already fit your
					working style. No cold leads. No bidding wars.
				</p>
				<div className="mt-5 space-y-3">
					{[
						'Step 1 — Build Your Profile',
						'Step 2 — Pax Deep Dive',
						'Step 3 — Get Matched',
						'$99 / month — keeps your profile active',
						'Selection fees: Shared intro $199 · Exclusive intro $399',
					].map((item) => (
						<div key={item} className="flex gap-3 text-sm">
							<CheckCircle2 className="text-amber mt-0.5 h-4 w-4 shrink-0" />
							<span>{item}</span>
						</div>
					))}
				</div>
			</div>

			<div className="mt-10 flex justify-end">
				<Link
					to="/agent/quiz"
					onClick={() =>
						saveStoredIntakeDraftForRole('agent', {
							agentRepresentation: representation,
						})
					}
					className={`${representation ? 'btn-primary' : 'bg-muted text-muted-foreground pointer-events-none'} inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium`}
				>
					I'm in — build my profile
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>
			<p className="text-muted-foreground mt-4 text-center text-xs">
				No payment required until you're ready to go live.
			</p>
		</FlowPageShell>
	)
}
