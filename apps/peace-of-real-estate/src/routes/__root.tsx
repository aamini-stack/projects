/// <reference types="vite/client" />
import { authClient } from '@/lib/auth-client'
import { clientEnv } from '@/env'
import type { QueryClient } from '@tanstack/react-query'
import {
	HeadContent,
	Link,
	Outlet,
	Scripts,
	createRootRouteWithContext,
	useRouterState,
} from '@tanstack/react-router'
import posthog from 'posthog-js'
import { ArrowRightLeft, User } from 'lucide-react'
import appCss from '../styles.css?url'

if (import.meta.env.MODE !== 'development') {
	posthog.init(clientEnv.VITE_PUBLIC_POSTHOG_KEY, {
		api_host: '/api/ingest',
		ui_host: 'https://us.posthog.com',
		defaults: '2025-11-30',
		person_profiles: 'always',
	})
}

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient
}>()({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: 'Peace of Real Estate' },
		],
		links: [
			{ rel: 'stylesheet', href: appCss },
			{ rel: 'icon', type: 'image/svg+xml', href: '/logomark-fullColor.svg' },
		],
	}),
	component: RootComponent,
})

function RootComponent() {
	const { data: session, isPending } = authClient.useSession()
	const router = useRouterState()
	const currentPath = router.location.pathname
	const userInitials = session?.user.name
		? session.user.name
				.split(/\s+/)
				.filter(Boolean)
				.slice(0, 2)
				.map((part) => part[0]?.toUpperCase() ?? '')
				.join('')
		: null

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="bg-background text-foreground min-w-80 antialiased">
				<div className="flex min-h-dvh flex-col">
					{/* Navigation — Institutional */}
					<header className="border-border bg-background sticky top-0 z-50 border-b">
						<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
							<Link to="/" className="flex items-center gap-3">
								<img
									src="/logomark-fullColor.svg"
									alt="Peace of Real Estate"
									className="h-7 w-7 shrink-0"
								/>
								<span className="font-serif text-base tracking-tight">
									Peace of Real Estate
								</span>
							</Link>

							<div className="flex items-center gap-1">
								{session ? (
									<>
										<Link
											to="/matches"
											className={`hidden items-center gap-2 px-4 py-2 text-sm font-medium transition-colors md:inline-flex ${
												currentPath === '/matches'
													? 'text-foreground'
													: 'text-muted-foreground hover:text-foreground'
											}`}
										>
											<ArrowRightLeft className="h-4 w-4" />
											Matches
										</Link>
										<div className="bg-border mx-2 h-4 w-px" />
										<Link
											to="/account"
											className="hover:bg-secondary flex items-center gap-3 px-3 py-1.5 transition-colors"
											aria-label="Open account"
										>
											<span className="border-border text-foreground flex h-8 w-8 items-center justify-center border text-xs font-semibold">
												{userInitials ? (
													userInitials
												) : (
													<User className="h-4 w-4" />
												)}
											</span>
											<div className="hidden text-left md:block">
												<p className="text-sm leading-none font-medium">
													{session.user.name}
												</p>
												<p className="text-muted-foreground mt-1 text-xs">
													Account
												</p>
											</div>
										</Link>
									</>
								) : (
									<Link
										to="/login"
										search={{ redirect: currentPath }}
										className="btn-secondary inline-flex items-center gap-2"
										aria-label="Sign in or create account"
									>
										<User className="h-4 w-4" />
										<span>{isPending ? 'Account' : 'Sign in'}</span>
									</Link>
								)}
							</div>
						</div>
					</header>

					{/* Main content */}
					<main className="flex flex-1 flex-col">
						<Outlet />
					</main>

					{/* Footer — Institutional */}
					<footer className="border-border bg-background border-t">
						<div className="mx-auto max-w-7xl px-6 py-8">
							<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
								<div className="flex items-center gap-2">
									<img
										src="/logomark-fullColor.svg"
										alt=""
										className="h-5 w-5"
									/>
									<span className="font-serif text-sm">
										Peace of Real Estate
									</span>
								</div>
								<p className="text-muted-foreground text-xs">
									© 2026 Peace of Real Estate. All rights reserved.
								</p>
							</div>
						</div>
					</footer>
				</div>
				<Scripts />
			</body>
		</html>
	)
}
