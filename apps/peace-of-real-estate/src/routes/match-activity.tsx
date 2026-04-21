import { createFileRoute } from '@tanstack/react-router'
import { ArrowRightLeft, User } from 'lucide-react'

export const Route = createFileRoute('/match-activity')({
	component: MatchActivity,
})

function MatchActivity() {
	return (
		<div className="mx-auto max-w-4xl px-6 py-12">
			<div className="mb-10 flex items-center gap-4">
				<div className="border-border bg-secondary flex h-10 w-10 items-center justify-center border">
					<ArrowRightLeft className="h-5 w-5" />
				</div>
				<div>
					<div className="data-label mb-1">Dashboard</div>
					<h1 className="font-serif text-2xl font-normal tracking-tight">
						Match Activity
					</h1>
				</div>
			</div>

			<div className="border-border bg-card card-institutional p-8">
				<div className="data-label mb-6">Recent Introductions</div>

				<div className="space-y-4">
					<div className="border-border flex items-center gap-4 border p-4">
						<div className="bg-secondary flex h-10 w-10 items-center justify-center">
							<User className="h-5 w-5" />
						</div>
						<div className="flex-1">
							<div className="text-sm font-medium">Alex M.</div>
							<div className="text-muted-foreground text-xs">
								Buyer &middot; Austin, TX
							</div>
						</div>
						<div className="data-number text-sm">92% fit</div>
					</div>
				</div>
			</div>
		</div>
	)
}
