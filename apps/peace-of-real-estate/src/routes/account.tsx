import { authClient } from '@/lib/auth-client'
import { getSession } from '@/lib/auth.functions'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { LogOut, Mail, ShieldCheck, User } from 'lucide-react'
import { useState, useTransition } from 'react'

export const Route = createFileRoute('/account')({
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
	component: Account,
})

function Account() {
	const { session } = Route.useRouteContext()
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	return (
		<div className="px-6 py-16 md:py-24">
			<div className="mx-auto max-w-3xl space-y-8">
				<div className="space-y-3">
					<div className="data-label text-olive inline-flex items-center gap-2">
						<ShieldCheck className="h-3.5 w-3.5" />
						Protected route
					</div>
					<h1 className="font-serif text-4xl font-normal tracking-tight md:text-5xl">
						Your account
					</h1>
					<p className="text-muted-foreground max-w-2xl leading-relaxed">
						Better Auth now controls account creation, sessions, and route
						access for PRE.
					</p>
				</div>

				<div className="border-border bg-card card-institutional grid gap-px md:grid-cols-2">
					<div className="bg-card p-6">
						<div className="mb-3 flex items-center gap-2 text-sm font-medium">
							<User className="h-4 w-4" />
							Name
						</div>
						<p className="text-lg font-medium">{session.user.name}</p>
					</div>
					<div className="bg-card p-6">
						<div className="mb-3 flex items-center gap-2 text-sm font-medium">
							<Mail className="h-4 w-4" />
							Email
						</div>
						<p className="text-lg font-medium">{session.user.email}</p>
					</div>
				</div>

				{errorMessage ? (
					<p className="border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
						{errorMessage}
					</p>
				) : null}

				<button
					type="button"
					onClick={() => {
						startTransition(async () => {
							setErrorMessage(null)
							const result = await authClient.signOut()

							if (result.error) {
								setErrorMessage(result.error.message ?? 'Unable to sign out.')
								return
							}

							await router.navigate({ to: '/login' })
						})
					}}
					disabled={isPending}
					className="btn-secondary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
				>
					<LogOut className="h-4 w-4" />
					{isPending ? 'Signing out...' : 'Sign out'}
				</button>
			</div>
		</div>
	)
}
