import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/showcase')({
	component: Showcase,
	head: () => ({
		meta: [{ title: 'Peace of Real Estate — Theme Showcase' }],
		links: [
			{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
			{
				rel: 'preconnect',
				href: 'https://fonts.gstatic.com',
				crossOrigin: 'anonymous',
			},
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=Outfit:wght@300;400;500;600&family=Syne:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&family=Quicksand:wght@400;500;600&display=swap',
			},
		],
	}),
})

function Showcase() {
	return (
		<div className="bg-neutral-50 text-neutral-800">
			<style>{`
				.font-pre-head { font-family: 'Outfit', system-ui, sans-serif; }
				.font-pre-body { font-family: 'DM Sans', system-ui, sans-serif; }
				.font-signal-head { font-family: 'Syne', sans-serif; }
				.font-signal-body { font-family: 'Outfit', sans-serif; }
				.font-fizz-head { font-family: 'Quicksand', sans-serif; }
				.font-fizz-body { font-family: 'Nunito', sans-serif; }
				.font-sift-head { font-family: 'DM Sans', system-ui, sans-serif; }
				.font-sift-body { font-family: 'DM Sans', system-ui, sans-serif; }

				.pre-card {
					border-radius: 8px;
				}
				.signal-pulse-soft {
					animation: signalPulseSoft 3s ease-in-out infinite;
				}
				@keyframes signalPulseSoft {
					0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74, 111, 165, 0.3); }
					50% { opacity: 0.9; box-shadow: 0 0 0 8px rgba(74, 111, 165, 0); }
				}
				.fizz-float-soft {
					animation: fizzFloatSoft 5s ease-in-out infinite;
				}
				@keyframes fizzFloatSoft {
					0%, 100% { transform: translateY(0); }
					50% { transform: translateY(-4px); }
				}
				.sift-paper {
					background-image: 
						linear-gradient(#F0EBE3 1px, transparent 1px),
						linear-gradient(90deg, #F0EBE3 1px, transparent 1px);
					background-size: 100% 24px, 24px 100%;
				}
			`}</style>

			{/* Header */}
			<header className="mx-auto max-w-3xl px-6 py-20 text-center">
				<p className="mb-4 text-xs tracking-[0.3em] text-neutral-400 uppercase">
					Theme Exploration
				</p>
				<h1
					className="mb-6 text-5xl font-light text-neutral-900 md:text-6xl"
					style={{ fontFamily: "'Outfit', sans-serif" }}
				>
					Four Directions
				</h1>
				<p className="mx-auto max-w-xl text-lg leading-relaxed text-neutral-500">
					From brand precision to soft startup energy. Each theme explores a
					different mood for Peace of Real Estate.
				</p>
			</header>

			{/* Theme 1: PRE Brand */}
			<section className="relative overflow-hidden bg-[#F8FAFC] px-6 py-24">
				<div className="relative z-10 mx-auto max-w-5xl">
					<div className="mb-12 flex items-baseline gap-4">
						<span className="text-xs tracking-[0.2em] text-[#024A70] uppercase">
							01
						</span>
						<div>
							<h2 className="font-pre-head text-3xl font-semibold text-[#0F172A]">
								PRE Brand
							</h2>
							<p className="font-pre-body mt-1 text-sm text-[#64748B]">
								Navy, sky, amber, and slate. Clean, professional, trustworthy.
							</p>
						</div>
					</div>

					<div className="grid gap-8 md:grid-cols-2">
						{/* Color swatches */}
						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#024A70] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#0F172A]">
										Navy (Primary)
									</p>
									<p className="font-mono text-xs text-[#64748B]">#024A70</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#74D4FF] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#0F172A]">
										Sky (Accent)
									</p>
									<p className="font-mono text-xs text-[#64748B]">#74D4FF</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#FFB86A] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#0F172A]">
										Amber (Accent)
									</p>
									<p className="font-mono text-xs text-[#64748B]">#FFB86A</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full border border-[#E2E8F0] bg-[#CAD5E2] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#0F172A]">
										Gray (Neutral)
									</p>
									<p className="font-mono text-xs text-[#64748B]">#CAD5E2</p>
								</div>
							</div>
						</div>

						{/* Component preview */}
						<div className="pre-card border border-[#E2E8F0] bg-white p-8 shadow-sm">
							<div className="mb-8 flex items-center justify-between">
								<span className="font-pre-body text-xs tracking-[0.2em] text-[#64748B] uppercase">
									Find Your Agent
								</span>
								<span className="h-[1px] w-8 bg-[#024A70]" />
							</div>
							<h3 className="font-pre-head mb-3 text-4xl leading-tight text-[#0F172A]">
								Match with
								<br />
								<span className="text-[#024A70]">precision.</span>
							</h3>
							<p className="font-pre-body mb-6 text-sm leading-relaxed text-[#64748B]">
								We connect you with agents who align with your working style,
								communication preferences, and values.
							</p>
							<div className="mb-6 flex gap-3">
								<span className="font-pre-body rounded-full bg-[#74D4FF]/15 px-3 py-1 text-xs font-medium text-[#024A70]">
									Bilateral Matching
								</span>
								<span className="font-pre-body rounded-full bg-[#FFB86A]/15 px-3 py-1 text-xs font-medium text-[#92400E]">
									No Lead Forms
								</span>
							</div>
							<a
								href="/showcase"
								className="font-pre-body inline-flex items-center gap-2 rounded-lg bg-[#024A70] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0369A1]"
							>
								Get Started
								<svg
									className="h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1.5}
										d="M17 8l4 4m0 0l-4 4m4-4H3"
									/>
								</svg>
							</a>
							<div className="mt-8 flex gap-4 border-t border-[#E2E8F0] pt-6">
								<div className="h-20 flex-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]" />
								<div className="h-20 flex-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]" />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Theme 2: Signal Soft */}
			<section className="relative overflow-hidden bg-[#F7F9FC] px-6 py-24">
				<div className="relative z-10 mx-auto max-w-5xl">
					<div className="mb-12 flex items-baseline gap-4">
						<span className="text-xs tracking-[0.2em] text-[#4A6FA5] uppercase">
							02
						</span>
						<div>
							<h2 className="font-signal-head text-3xl font-semibold text-[#1E293B]">
								Signal Soft
							</h2>
							<p className="font-signal-body mt-1 text-sm text-[#94A3B8]">
								Softened electric energy. Approachable, clear, and calm.
							</p>
						</div>
					</div>

					<div className="grid gap-8 md:grid-cols-2">
						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full border border-[#E2E8F0] bg-[#F7F9FC] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#1E293B]">
										Ice White
									</p>
									<p className="font-mono text-xs text-[#94A3B8]">#F7F9FC</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#4A6FA5] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#1E293B]">
										Soft Denim
									</p>
									<p className="font-mono text-xs text-[#94A3B8]">#4A6FA5</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#87CEEB] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#1E293B]">Sky Blue</p>
									<p className="font-mono text-xs text-[#94A3B8]">#87CEEB</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#1E293B] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#1E293B]">
										Slate Ink
									</p>
									<p className="font-mono text-xs text-[#94A3B8]">#1E293B</p>
								</div>
							</div>
						</div>

						<div className="rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
							<div className="mb-6 flex items-center gap-2">
								<div className="signal-pulse-soft h-2 w-2 rounded-full bg-[#4A6FA5]" />
								<span className="font-signal-body text-xs tracking-[0.2em] text-[#94A3B8] uppercase">
									Now Live
								</span>
							</div>
							<h3 className="font-signal-head mb-3 text-4xl leading-tight text-[#1E293B]">
								Build with
								<br />
								<span className="text-[#4A6FA5]">confidence.</span>
							</h3>
							<p className="font-signal-body mb-6 text-sm leading-relaxed text-[#94A3B8]">
								A calmer take on startup energy. Clear signals, no noise — just
								tools that work.
							</p>
							<div className="mb-6 flex gap-3">
								<span className="font-signal-body rounded-full bg-[#4A6FA5]/10 px-3 py-1 text-xs font-medium text-[#4A6FA5]">
									v2.0 Released
								</span>
								<span className="font-signal-body rounded-full bg-[#87CEEB]/20 px-3 py-1 text-xs font-medium text-[#0369A1]">
									99.9% Uptime
								</span>
							</div>
							<a
								href="/showcase"
								className="font-signal-body inline-flex items-center gap-2 rounded-full bg-[#1E293B] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4A6FA5]"
							>
								Start building
								<svg
									className="h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1.5}
										d="M17 8l4 4m0 0l-4 4m4-4H3"
									/>
								</svg>
							</a>
							<div className="mt-8 flex gap-4 border-t border-[#E2E8F0] pt-6">
								<div className="h-20 flex-1 rounded-2xl border border-[#E2E8F0] bg-[#F7F9FC]" />
								<div className="h-20 flex-1 rounded-2xl border border-[#E2E8F0] bg-[#F7F9FC]" />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Theme 3: Fizz Soft */}
			<section className="relative overflow-hidden bg-[#FFFBF5] px-6 py-24">
				<div className="relative z-10 mx-auto max-w-5xl">
					<div className="mb-12 flex items-baseline gap-4">
						<span className="text-xs tracking-[0.2em] text-[#D4A373] uppercase">
							03
						</span>
						<div>
							<h2 className="font-fizz-head text-3xl font-semibold text-[#3D3229]">
								Fizz Soft
							</h2>
							<p className="font-fizz-body mt-1 text-sm text-[#A68A64]">
								Warm, bubbly energy — muted and approachable.
							</p>
						</div>
					</div>

					<div className="grid gap-8 md:grid-cols-2">
						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full border border-[#F5E6D3] bg-[#FFFBF5] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#3D3229]">
										Cream Soda
									</p>
									<p className="font-mono text-xs text-[#A68A64]">#FFFBF5</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#D4A373] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#3D3229]">
										Warm Peach
									</p>
									<p className="font-mono text-xs text-[#A68A64]">#D4A373</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#E8D5A3] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#3D3229]">
										Soft Gold
									</p>
									<p className="font-mono text-xs text-[#A68A64]">#E8D5A3</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#3D3229] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#3D3229]">
										Warm Espresso
									</p>
									<p className="font-mono text-xs text-[#A68A64]">#3D3229</p>
								</div>
							</div>
						</div>

						<div className="fizz-float-soft rounded-3xl border border-[#F5E6D3]/50 bg-white p-8 shadow-sm">
							<div className="mb-6 flex items-center justify-between">
								<span className="font-fizz-body text-xs tracking-[0.2em] text-[#A68A64] uppercase">
									Product
								</span>
								<span className="font-fizz-body rounded-full bg-[#D4A373] px-3 py-1 text-xs font-medium text-white">
									Beta
								</span>
							</div>
							<h3 className="font-fizz-head mb-3 text-4xl leading-tight text-[#3D3229]">
								Your ideas,
								<br />
								<span className="text-[#D4A373]">effervescent.</span>
							</h3>
							<p className="font-fizz-body mb-6 text-sm leading-relaxed text-[#A68A64]">
								A gentler fizz. Warm tools for creators who value
								approachability as much as craft.
							</p>
							<div className="grid grid-cols-2 gap-3">
								<div className="rounded-2xl bg-[#FFFBF5] p-4 text-center">
									<p className="font-fizz-head text-2xl text-[#D4A373]">2x</p>
									<p className="font-fizz-body text-xs text-[#A68A64]">
										Faster builds
									</p>
								</div>
								<div className="rounded-2xl bg-[#FFFBF5] p-4 text-center">
									<p className="font-fizz-head text-2xl text-[#E8D5A3]">100+</p>
									<p className="font-fizz-body text-xs text-[#A68A64]">
										Happy teams
									</p>
								</div>
							</div>
							<div className="mt-6">
								<a
									href="/showcase"
									className="font-fizz-body inline-flex items-center gap-2 rounded-full bg-[#D4A373] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3D3229]"
								>
									Pop the hood
									<svg
										className="h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={1.5}
											d="M17 8l4 4m0 0l-4 4m4-4H3"
										/>
									</svg>
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Theme 4: Sift */}
			<section className="relative overflow-hidden bg-[#FAF6F0] px-6 py-24">
				<div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-[#E8A87C]/10 blur-3xl" />
				<div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#7C8B9A]/10 blur-3xl" />
				<div className="relative z-10 mx-auto max-w-5xl">
					<div className="mb-12 flex items-baseline gap-4">
						<span className="text-xs tracking-[0.2em] text-[#7C8B9A] uppercase">
							04
						</span>
						<div>
							<h2 className="font-sift-head text-3xl font-semibold text-[#2D3748]">
								Sift
							</h2>
							<p className="font-sift-body mt-1 text-sm text-[#7C8B9A]">
								Warm, calming, and paper-like. News therapy for the soul.
							</p>
						</div>
					</div>

					<div className="grid gap-8 md:grid-cols-2">
						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full border border-[#E8E0D4] bg-[#FAF6F0] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#2D3748]">
										Warm Parchment
									</p>
									<p className="font-mono text-xs text-[#7C8B9A]">#FAF6F0</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#7C8B9A] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#2D3748]">
										Soft Slate
									</p>
									<p className="font-mono text-xs text-[#7C8B9A]">#7C8B9A</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#E8A87C] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#2D3748]">
										Warm Clay
									</p>
									<p className="font-mono text-xs text-[#7C8B9A]">#E8A87C</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#2D3748] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#2D3748]">Deep Ink</p>
									<p className="font-mono text-xs text-[#7C8B9A]">#2D3748</p>
								</div>
							</div>
						</div>

						<div className="rounded-2xl border border-[#E8E0D4] bg-white/80 p-8 shadow-sm backdrop-blur-sm">
							<div className="mb-6 flex items-center gap-2">
								<div className="h-2 w-2 rounded-full bg-[#E8A87C]" />
								<span className="font-sift-body text-xs tracking-[0.2em] text-[#7C8B9A] uppercase">
									Topics
								</span>
							</div>
							<h3 className="font-sift-head mb-4 text-3xl leading-tight text-[#2D3748]">
								Feel news
								<br />
								<span className="text-[#7C8B9A]">differently.</span>
							</h3>
							<p className="font-sift-body mb-6 text-sm leading-relaxed text-[#7C8B9A]">
								Sift unpacks contentious issues to help reduce news anxiety.
								Calm language, clear sources, room for reflection.
							</p>
							<div className="space-y-4">
								<div className="flex items-start gap-4 rounded-xl border border-[#E8E0D4]/40 bg-[#FAF6F0]/60 p-4">
									<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#E8A87C]/20">
										<svg
											className="h-5 w-5 text-[#2D3748]"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={1.5}
												d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
											/>
										</svg>
									</div>
									<div>
										<p className="font-sift-body text-sm font-medium text-[#2D3748]">
											Shed light on backstory
										</p>
										<p className="font-sift-body mt-0.5 text-xs text-[#7C8B9A]">
											Explore the history of today's issues
										</p>
									</div>
								</div>
								<div className="flex items-start gap-4 rounded-xl border border-[#E8E0D4]/40 bg-[#FAF6F0]/60 p-4">
									<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#E8A87C]/20">
										<svg
											className="h-5 w-5 text-[#2D3748]"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={1.5}
												d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
											/>
										</svg>
									</div>
									<div>
										<p className="font-sift-body text-sm font-medium text-[#2D3748]">
											Engage your brain
										</p>
										<p className="font-sift-body mt-0.5 text-xs text-[#7C8B9A]">
											Interactive features for critical thinking
										</p>
									</div>
								</div>
								<div className="flex items-start gap-4 rounded-xl border border-[#E8E0D4]/40 bg-[#FAF6F0]/60 p-4">
									<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#E8A87C]/20">
										<svg
											className="h-5 w-5 text-[#2D3748]"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={1.5}
												d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
											/>
										</svg>
									</div>
									<div>
										<p className="font-sift-body text-sm font-medium text-[#2D3748]">
											Room for reflection
										</p>
										<p className="font-sift-body mt-0.5 text-xs text-[#7C8B9A]">
											Consider what you know and how you feel
										</p>
									</div>
								</div>
							</div>
							<div className="mt-8 border-t border-[#E8E0D4] pt-6">
								<a
									href="/showcase"
									className="font-sift-body inline-flex items-center gap-2 text-sm font-medium text-[#2D3748] transition-colors hover:text-[#E8A87C]"
								>
									Explore topics
									<span className="text-lg">→</span>
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	)
}
