import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Bot } from 'lucide-react'

import { FlowPageShell } from '@/components/flow-page-shell'

export const Route = createFileRoute('/agent/chat')({
	component: AgentChat,
})

function AgentChat() {
	return (
		<FlowPageShell
			backTo="/agent/deep-dive"
			backLabel="Back"
			title="Pax Agent Chat"
			subtitle="Final profile refinement"
			icon={Bot}
			iconClassName="border-amber bg-amber-tint text-amber"
		>
			<div className="border-border bg-background rounded-2xl border p-5 text-sm leading-relaxed">
				Tell me about the clients who thrive with you, the promises you make,
				and the situations where you create the most peace.
			</div>
			<textarea
				rows={6}
				placeholder="Type your answer..."
				className="border-border bg-background focus:border-primary mt-4 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none"
			/>
			<div className="mt-10 flex justify-end">
				<Link
					to="/agent/subscribe"
					className="btn-primary inline-flex items-center gap-2"
				>
					Finish Profile
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>
		</FlowPageShell>
	)
}
