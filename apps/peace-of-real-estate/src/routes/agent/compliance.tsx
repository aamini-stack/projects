import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { FlowPageShell } from '@/components/flow-page-shell'

export const Route = createFileRoute('/agent/compliance')({
	component: AgentCompliance,
})

function AgentCompliance() {
	const [attested, setAttested] = useState(false)
	const [insurance, setInsurance] = useState('')
	const canContinue = attested && insurance.length > 0

	return (
		<FlowPageShell
			backTo="/agent/profile"
			backLabel="Back to details"
			title="Compliance Checklist"
			subtitle="Both items must be completed"
			icon={ShieldCheck}
			iconClassName="border-amber bg-amber-tint text-amber"
		>
			<label className="border-border bg-background flex items-start gap-3 rounded-2xl border p-5 text-sm leading-relaxed">
				<input
					type="checkbox"
					checked={attested}
					onChange={(event) => setAttested(event.target.checked)}
					className="mt-1"
				/>
				<span>
					I confirm that my real estate license is currently active and in good
					standing in all states where I am licensed, that there are no pending
					or active disciplinary actions, complaints, or investigations, and
					that I have not previously had a real estate license suspended,
					revoked, or subject to formal disciplinary action.
				</span>
			</label>

			<div className="mt-8">
				<div className="mb-3 text-sm font-medium">
					Errors and Omissions (E&O) Insurance
				</div>
				<div className="space-y-3">
					{[
						'Yes, I carry my own E&O policy',
						'Yes, I am covered through my brokerage',
						'No',
					].map((option) => (
						<label
							key={option}
							className="border-border bg-background flex items-center gap-3 rounded-xl border p-4 text-sm"
						>
							<input
								type="radio"
								name="insurance"
								checked={insurance === option}
								onChange={() => setInsurance(option)}
							/>
							{option}
						</label>
					))}
				</div>
			</div>

			<div className="mt-10 flex justify-end">
				<Link
					to="/agent/peace-pact"
					className={`${canContinue ? 'btn-primary' : 'bg-muted text-muted-foreground pointer-events-none'} inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium`}
				>
					Complete Registration
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>
		</FlowPageShell>
	)
}
