import { getSession } from '@/lib/auth.functions'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { ArrowRight, ArrowRightLeft, ShieldCheck } from 'lucide-react'

export const Route = createFileRoute('/matches/')({
	beforeLoad: async ({ location }) => {
		const session = await getSession()

		if (!session) {
			throw redirect({
				to: '/login',
				search: { redirect: location.href },
			})
		}

		return { session }
	},
	component: MatchesPage,
})

function MatchesPage() {
	const { session } = Route.useRouteContext()

	return (
		<div className="px-6 py-16 md:py-24">
			<div className="mx-auto max-w-4xl space-y-8">
				<div className="space-y-3">
					<div className="data-label text-teal inline-flex items-center gap-2">
						<ShieldCheck className="h-3.5 w-3.5" />
						Signed-in only
					</div>
					<h1 className="font-serif text-4xl font-normal tracking-tight md:text-5xl">
						Your matches
					</h1>
					<p className="text-muted-foreground max-w-2xl leading-relaxed">
						{session.user.name}, this area will hold your ranked matches and
						introduction activity once your consumer or agent flow is connected
						to account state.
					</p>
				</div>

				<div className="border-border bg-card card-institutional grid gap-px md:grid-cols-2">
					<Link
						to="/consumer"
						className="bg-card hover:bg-teal-tint p-6 transition-colors"
					>
						<p className="text-teal text-sm font-medium">Consumer journey</p>
						<p className="text-muted-foreground mt-2 text-sm leading-relaxed">
							Complete your intake to unlock ranked agent matches.
						</p>
						<span className="text-teal mt-4 inline-flex items-center gap-2 text-sm font-medium">
							Start consumer flow
							<ArrowRight className="h-4 w-4" />
						</span>
					</Link>
					<Link
						to="/agent"
						className="bg-card hover:bg-terracotta-tint p-6 transition-colors"
					>
						<p className="text-terracotta text-sm font-medium">Agent journey</p>
						<p className="text-muted-foreground mt-2 text-sm leading-relaxed">
							Finish your profile to review introductions and fit activity.
						</p>
						<span className="text-terracotta mt-4 inline-flex items-center gap-2 text-sm font-medium">
							Start agent flow
							<ArrowRight className="h-4 w-4" />
						</span>
					</Link>
				</div>

				<div className="border-border bg-card card-institutional p-8">
					<div className="mb-6 flex items-center gap-4">
						<div className="border-border flex h-10 w-10 items-center justify-center border">
							<ArrowRightLeft className="h-5 w-5" />
						</div>
						<div>
							<h2 className="font-serif text-xl">How matching works</h2>
							<p className="text-muted-foreground text-sm">
								Public overview of bilateral matching on PRE
							</p>
						</div>
					</div>
					<Link
						to="/match-activity"
						className="btn-secondary inline-flex items-center gap-2"
					>
						View public match activity
						<ArrowRight className="h-4 w-4" />
					</Link>
				</div>
			</div>
		</div>
	)
}
