import { Card, CardContent } from '@aamini/ui/components/card'
import { Field, FieldGroup, FieldLabel } from '@aamini/ui/components/field'
import { Input } from '@aamini/ui/components/input'
import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

type AuthMode = 'sign-in' | 'sign-up'

export function AuthCard({
	mode,
	redirect,
}: {
	mode: AuthMode
	redirect?: string
}) {
	const isSignUp = mode === 'sign-up'
	const title = isSignUp ? 'Create your account' : 'Welcome Back'
	const primaryLabel = isSignUp ? 'Create account' : 'Sign in'
	const alternateCopy = isSignUp
		? 'Already have an account?'
		: "Don't have an account?"
	const [isGoogleLoading, setIsGoogleLoading] = useState(false)

	const handleGoogleSignIn = async () => {
		setIsGoogleLoading(true)

		try {
			const { data, error } = await authClient.signIn.social({
				provider: 'google',
				callbackURL: redirect ?? '/',
			})

			if (error) {
				throw error
			}

			window.location.assign(data?.url ?? redirect ?? '/')
		} catch (error) {
			console.error('Google sign-in failed', error)
			setIsGoogleLoading(false)
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
							<button
								type="button"
								onClick={handleGoogleSignIn}
								disabled={isGoogleLoading}
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

							<form className="space-y-6">
								<FieldGroup>
									{isSignUp ? (
										<Field>
											<FieldLabel htmlFor="name">Full name</FieldLabel>
											<Input id="name" placeholder="Jordan Lee" disabled />
										</Field>
									) : null}
									<Field>
										<FieldLabel htmlFor="email">Email</FieldLabel>
										<Input
											id="email"
											type="email"
											placeholder="you@example.com"
											disabled
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
											disabled
										/>
									</Field>
									<button
										type="button"
										disabled
										className="bg-primary text-primary-foreground inline-flex w-full items-center justify-center px-4 py-3 text-sm font-medium opacity-70"
									>
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
