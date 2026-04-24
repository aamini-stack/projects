import { Card, CardContent } from '@aamini/ui/components/card'
import { Field, FieldGroup, FieldLabel } from '@aamini/ui/components/field'
import { Input } from '@aamini/ui/components/input'
import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'

type AuthMode = 'sign-in' | 'sign-up'

const DEFAULT_POST_AUTH_REDIRECT = '/match-activity'

export function AuthCard({
	mode,
	redirect,
}: {
	mode: AuthMode
	redirect?: string
}) {
	const resolvedRedirect =
		redirect && redirect !== '/account' ? redirect : DEFAULT_POST_AUTH_REDIRECT
	const isSignUp = mode === 'sign-up'
	const title = isSignUp ? 'Create your account' : 'Welcome Back'
	const primaryLabel = isSignUp ? 'Create account' : 'Sign in'
	const alternateCopy = isSignUp
		? 'Already have an account?'
		: "Don't have an account?"
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isGoogleLoading, setIsGoogleLoading] = useState(false)
	const [googleAvailable, setGoogleAvailable] = useState(true)

	const callbackURL =
		typeof window !== 'undefined'
			? new URL(resolvedRedirect, window.location.origin).toString()
			: resolvedRedirect

	const handleGoogleSignIn = async () => {
		setIsGoogleLoading(true)

		try {
			const { data, error } = await authClient.signIn.social({
				provider: 'google',
				callbackURL,
			})

			if (error) {
				throw error
			}

			window.location.assign(data?.url ?? resolvedRedirect)
		} catch (error) {
			if (
				error &&
				typeof error === 'object' &&
				'code' in error &&
				error.code === 'PROVIDER_NOT_FOUND'
			) {
				setGoogleAvailable(false)
				toast.error(
					'Google login not configured on localhost. Use email and password.',
				)
			} else {
				toast.error('Google sign-in failed. Try again.')
			}

			console.error('Google sign-in failed', error)
			setIsGoogleLoading(false)
		}
	}

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (isSubmitting) {
			return
		}

		setIsSubmitting(true)

		try {
			if (isSignUp) {
				const { error } = await authClient.signUp.email({
					name: name.trim(),
					email: email.trim(),
					password,
					callbackURL,
				})

				if (error) {
					throw error
				}

				window.location.assign(resolvedRedirect)
				return
			}

			const { data, error } = await authClient.signIn.email({
				email: email.trim(),
				password,
				callbackURL,
			})

			if (error) {
				throw error
			}

			window.location.assign(data?.url ?? resolvedRedirect)
		} catch (error) {
			const message =
				error && typeof error === 'object' && 'message' in error
					? String(error.message)
					: isSignUp
						? 'Unable to create account. Try again.'
						: 'Unable to sign in. Check email and password.'

			toast.error(message)
			console.error(isSignUp ? 'Sign-up failed' : 'Sign-in failed', error)
			setIsSubmitting(false)
		}
	}

	return (
		<div className="flex h-full w-full flex-1 items-center justify-center px-6 py-12">
			<div className="flex w-full max-w-md flex-col items-center gap-8">
				<div className="text-center">
					<div className="data-label text-ochre mb-3">
						{isSignUp ? 'New Account' : 'Authentication'}
					</div>
					<h1 className="font-serif text-3xl font-normal">{title}</h1>
				</div>

				<Card className="border-border w-full">
					<CardContent className="pt-6">
						<div className="space-y-6">
							{googleAvailable ? (
								<>
									<button
										type="button"
										onClick={handleGoogleSignIn}
										disabled={isGoogleLoading || isSubmitting}
										className="border-border bg-background text-foreground hover:bg-secondary inline-flex w-full items-center justify-center gap-2 border px-4 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70"
									>
										{isGoogleLoading ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : null}
										Continue with Google
									</button>

									<div className="text-muted-foreground relative py-2 text-center text-xs tracking-[0.2em] uppercase">
										<span className="bg-background relative z-10 px-3">or</span>
										<div className="bg-border absolute top-1/2 left-0 h-px w-full" />
									</div>
								</>
							) : null}

							<form className="space-y-6" onSubmit={handleSubmit}>
								<FieldGroup>
									{isSignUp ? (
										<Field>
											<FieldLabel htmlFor="name">Full name</FieldLabel>
											<Input
												id="name"
												placeholder="Jordan Lee"
												value={name}
												onChange={(event) => setName(event.target.value)}
												disabled={isSubmitting || isGoogleLoading}
												required
											/>
										</Field>
									) : null}
									<Field>
										<FieldLabel htmlFor="email">Email</FieldLabel>
										<Input
											id="email"
											type="email"
											placeholder="you@example.com"
											value={email}
											onChange={(event) => setEmail(event.target.value)}
											disabled={isSubmitting || isGoogleLoading}
											autoComplete="email"
											required
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="password">Password</FieldLabel>
										<Input
											id="password"
											type="password"
											placeholder={
												isSignUp ? 'Choose password' : 'Enter password'
											}
											value={password}
											onChange={(event) => setPassword(event.target.value)}
											disabled={isSubmitting || isGoogleLoading}
											autoComplete={
												isSignUp ? 'new-password' : 'current-password'
											}
											required
										/>
									</Field>
									<button
										type="submit"
										disabled={isSubmitting || isGoogleLoading}
										className="bg-primary text-primary-foreground inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
									>
										{isSubmitting ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : null}
										{primaryLabel}
									</button>
									<p className="text-muted-foreground text-center text-sm">
										{alternateCopy}{' '}
										{isSignUp ? (
											<Link
												to="/login"
												{...(redirect ? { search: { redirect } } : {})}
												className="text-foreground font-medium underline underline-offset-4"
											>
												Sign in
											</Link>
										) : (
											<Link
												to="/signup"
												{...(redirect ? { search: { redirect } } : {})}
												className="text-foreground font-medium underline underline-offset-4"
											>
												Sign up
											</Link>
										)}
									</p>
								</FieldGroup>
							</form>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
