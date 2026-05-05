import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Bot } from 'lucide-react'

import { FlowPageShell } from '@/components/flow-page-shell'

export const Route = createFileRoute('/agent/deep-dive')({
	component: AgentDeepDive,
})

function AgentDeepDive() {
	return (
		<FlowPageShell
			backTo="/agent/peace-pact"
			backLabel="Back"
			title="Pax Deep Dive"
			subtitle="Prepare your match profile"
			icon={Bot}
			iconClassName="border-amber bg-amber-tint text-amber"
		>
			<h2 className="font-heading text-2xl font-normal tracking-tight">
				Pax is ready to get to know your practice.
			</h2>
			<p className="text-muted-foreground mt-3 text-sm leading-relaxed">
				This short conversation helps Pax refine your match profile and write a
				consumer-facing value proposition if you opted into AI writer support.
			</p>
			<div className="mt-10 flex justify-end">
				<Link
					to="/agent/chat"
					className="btn-primary inline-flex items-center gap-2"
				>
					Start Pax Chat
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>
		</FlowPageShell>
	)
}
