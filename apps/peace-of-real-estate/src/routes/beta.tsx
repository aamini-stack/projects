import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { ArrowRight, Lock, ShieldCheck, Sparkles } from 'lucide-react'

async function authenticateBeta(password: string) {
	const response = await fetch('/api/beta/auth', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ password }),
	})

	if (!response.ok) return false

	const data = await response.json()
	return data.success
}

export const Route = createFileRoute('/beta')({
	component: BetaLogin,
})

function BetaLogin() {
	const navigate = useNavigate()
	const [password, setPassword] = useState('')
	const [error, setError] = useState(false)
	const [success, setSuccess] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		inputRef.current?.focus()
	}, [])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (await authenticateBeta(password)) {
			setError(false)
			setSuccess(true)
			setTimeout(async () => {
				await navigate({ to: '/' })
			}, 800)
		} else {
			setError(true)
			setPassword('')
			inputRef.current?.focus()
		}
	}

	return (
		<div className="theme-glow relative flex min-h-dvh w-full items-center justify-center overflow-hidden px-6 py-12">
			<div className="bg-sky/25 absolute -top-24 right-1/4 h-80 w-80 rounded-full blur-3xl" />
			<div className="bg-amber/15 absolute bottom-0 left-1/4 h-80 w-80 rounded-full blur-3xl" />

			<div className="soft-panel relative z-10 w-full max-w-lg p-8 md:p-10">
				<div className="mb-8 flex items-center justify-between gap-4">
					<div className="border-navy/20 bg-navy-tint text-navy flex h-12 w-12 items-center justify-center rounded-full border">
						<ShieldCheck className="h-6 w-6" />
					</div>
					<div className="data-label text-navy">Private Preview</div>
				</div>

				<div className="mb-10 text-center">
					<div className="bg-amber-tint text-amber mx-auto mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase">
						<Sparkles className="h-3.5 w-3.5" />
						Early Access
					</div>
					<h1 className="font-heading mb-4 text-4xl font-normal tracking-tight md:text-5xl">
						Step into a calmer way to find your agent.
					</h1>
					<p className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed">
						Peace of Real Estate is currently open to invited consumers, agents,
						and early customers helping shape the matching experience.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="relative">
						<Lock className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
						<input
							ref={inputRef}
							type="password"
							value={password}
							onChange={(e) => {
								setPassword(e.target.value)
								setError(false)
							}}
							placeholder="Enter invite password"
							className={`border-border bg-background focus:border-primary placeholder:text-muted-foreground w-full rounded-xl border py-3 pr-4 pl-11 text-sm transition-colors outline-none ${error ? 'border-warning' : ''} ${success ? 'border-success' : ''}`}
						/>
					</div>

					{error ? (
						<p className="text-warning text-center text-xs tracking-wide">
							Invite password not recognized. Please try again.
						</p>
					) : null}

					{success ? (
						<p className="text-success text-center text-xs tracking-wide">
							Access granted. Welcome in.
						</p>
					) : null}

					<button
						type="submit"
						disabled={success}
						className="btn-primary group flex w-full items-center justify-center gap-2 disabled:opacity-70"
					>
						{success ? 'Entering...' : 'Unlock Preview'}
						<ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
					</button>
				</form>

				<p className="text-muted-foreground mt-8 text-center text-xs leading-relaxed">
					Need an invite?{' '}
					<a
						href="mailto:hello@peaceofrealestate.com"
						className="text-navy font-medium underline underline-offset-4 transition-opacity hover:opacity-75"
					>
						Request access
					</a>
				</p>
			</div>
		</div>
	)
}
