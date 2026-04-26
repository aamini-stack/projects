import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/showcase')({
	component: Showcase,
	head: () => ({
		meta: [{ title: 'Freelance Site — Theme Showcase' }],
		links: [
			{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
			{
				rel: 'preconnect',
				href: 'https://fonts.gstatic.com',
				crossOrigin: 'anonymous',
			},
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Space+Grotesk:wght@300;400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300&family=Work+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap',
			},
		],
	}),
})

function Showcase() {
	return (
		<div className="bg-neutral-50 text-neutral-800">
			<style>{`
				.font-fairway-head { font-family: 'Cormorant Garamond', serif; }
				.font-fairway-body { font-family: 'DM Sans', sans-serif; }
				.font-links-head { font-family: 'Space Grotesk', sans-serif; }
				.font-links-body { font-family: 'Work Sans', sans-serif; }
				.font-tee-head { font-family: 'Fraunces', serif; }
				.font-tee-body { font-family: 'DM Sans', sans-serif; }
				.font-dew-head { font-family: 'Cormorant Garamond', serif; }
				.font-dew-body { font-family: 'Work Sans', sans-serif; }
				.font-caddie-head { font-family: 'Space Grotesk', sans-serif; }
				.font-caddie-body { font-family: 'DM Sans', sans-serif; }

				.stripe-bg {
					background: repeating-linear-gradient(
						90deg,
						transparent,
						transparent 60px,
						rgba(0,0,0,0.02) 60px,
						rgba(0,0,0,0.02) 61px
					);
				}
				.dew-shimmer {
					background: linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
					background-size: 200% 200%;
					animation: shimmer 6s ease-in-out infinite;
				}
				@keyframes shimmer {
					0%, 100% { background-position: 0% 50%; }
					50% { background-position: 100% 50%; }
				}
				.grain {
					position: relative;
				}
				.grain::before {
					content: '';
					position: absolute;
					inset: 0;
					background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
					pointer-events: none;
					z-index: 1;
				}
				.grain > * {
					position: relative;
					z-index: 2;
				}
			`}</style>

			{/* Header */}
			<header className="mx-auto max-w-3xl px-6 py-20 text-center">
				<p className="mb-4 text-xs tracking-[0.3em] text-neutral-400 uppercase">
					Theme Exploration
				</p>
				<h1
					className="mb-6 text-5xl font-light text-neutral-900 md:text-6xl"
					style={{ fontFamily: "'Cormorant Garamond', serif" }}
				>
					Five Directions
				</h1>
				<p className="mx-auto max-w-xl text-lg leading-relaxed text-neutral-500">
					Clean, light, and precise — like a well-kept course at dawn. No luxury
					fashion noise. Just breathing room, good typography, and quiet
					confidence.
				</p>
			</header>

			{/* Theme 1: Fairway Fresh */}
			<section className="relative overflow-hidden bg-[#F6F7F3] px-6 py-24">
				<div className="stripe-bg absolute inset-0 opacity-50" />
				<div className="relative z-10 mx-auto max-w-5xl">
					<div className="mb-12 flex items-baseline gap-4">
						<span className="text-xs tracking-[0.2em] text-[#6B7F5E] uppercase">
							01
						</span>
						<div>
							<h2 className="font-fairway-head text-3xl font-semibold text-[#2D3A25]">
								Fairway Fresh
							</h2>
							<p className="font-fairway-body mt-1 text-sm text-[#6B7F5E]">
								Mowed-grass precision. Sage, cream, sky.
							</p>
						</div>
					</div>

					<div className="grid gap-8 md:grid-cols-2">
						{/* Color swatches */}
						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full border border-[#D4D9CF] bg-[#F6F7F3] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#2D3A25]">
										Fairway Cream
									</p>
									<p className="font-mono text-xs text-[#6B7F5E]">#F6F7F3</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#6B7F5E] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#2D3A25]">
										Sage Green
									</p>
									<p className="font-mono text-xs text-[#6B7F5E]">#6B7F5E</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#87CEEB] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#2D3A25]">
										Tee Box Sky
									</p>
									<p className="font-mono text-xs text-[#6B7F5E]">#87CEEB</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#2D3A25] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#2D3A25]">
										Deep Pine
									</p>
									<p className="font-mono text-xs text-[#6B7F5E]">#2D3A25</p>
								</div>
							</div>
						</div>

						{/* Component preview */}
						<div className="rounded-2xl border border-[#E8EBE3] bg-white p-8 shadow-sm">
							<div className="mb-8 flex items-center justify-between">
								<span className="font-fairway-body text-xs tracking-[0.2em] text-[#6B7F5E] uppercase">
									Portfolio
								</span>
								<span className="h-[1px] w-8 bg-[#6B7F5E]" />
							</div>
							<h3 className="font-fairway-head mb-3 text-4xl leading-tight text-[#2D3A25]">
								Built with
								<br />
								precision.
							</h3>
							<p className="font-fairway-body mb-6 text-sm leading-relaxed text-[#6B7F5E]">
								Every project starts on a clean tee box. No clutter, no noise —
								just the work, presented honestly.
							</p>
							<a
								href="/showcase"
								className="font-fairway-body inline-flex items-center gap-2 text-sm font-medium text-[#2D3A25] transition-colors hover:text-[#6B7F5E]"
							>
								View selected work
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
							<div className="mt-8 flex gap-4 border-t border-[#E8EBE3] pt-6">
								<div className="h-20 flex-1 rounded-lg border border-[#E8EBE3] bg-[#F6F7F3]" />
								<div className="h-20 flex-1 rounded-lg border border-[#E8EBE3] bg-[#F6F7F3]" />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Theme 2: Links Minimal */}
			<section className="grain relative bg-[#EDE8E0] px-6 py-24">
				<div className="relative z-10 mx-auto max-w-5xl">
					<div className="mb-12 flex items-baseline gap-4">
						<span className="text-xs tracking-[0.2em] text-[#9E9386] uppercase">
							02
						</span>
						<div>
							<h2 className="font-links-head text-3xl font-medium text-[#3D3832]">
								Links Minimal
							</h2>
							<p className="font-links-body mt-1 text-sm text-[#9E9386]">
								Coastal sand, fog, and driftwood. Texture without weight.
							</p>
						</div>
					</div>

					<div className="grid gap-8 md:grid-cols-2">
						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full border border-[#C9C0B6] bg-[#EDE8E0] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#3D3832]">
										Sand Trap
									</p>
									<p className="font-mono text-xs text-[#9E9386]">#EDE8E0</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#C9C0B6] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#3D3832]">
										Driftwood
									</p>
									<p className="font-mono text-xs text-[#9E9386]">#C9C0B6</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#8BA89B] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#3D3832]">Seafoam</p>
									<p className="font-mono text-xs text-[#9E9386]">#8BA89B</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#3D3832] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#3D3832]">
										Wet Stone
									</p>
									<p className="font-mono text-xs text-[#9E9386]">#3D3832</p>
								</div>
							</div>
						</div>

						<div className="rounded-sm border border-[#D8D0C8] bg-[#F5F2EE] p-8 shadow-sm">
							<div className="mb-8 flex items-center gap-3">
								<div className="h-8 w-8 rounded-sm bg-[#3D3832]" />
								<span className="font-links-body text-xs tracking-[0.15em] text-[#9E9386] uppercase">
									Available for projects
								</span>
							</div>
							<h3 className="font-links-head mb-4 text-3xl leading-snug text-[#3D3832]">
								Freelance developer
								<br />& technical lead
							</h3>
							<p className="font-links-body mb-8 max-w-sm text-sm leading-relaxed text-[#9E9386]">
								Ten years shipping products. I work with teams who value clarity
								over complexity and users who deserve interfaces that simply
								work.
							</p>
							<div className="flex gap-3">
								<a
									href="/showcase"
									className="font-links-body rounded-sm bg-[#3D3832] px-5 py-2.5 text-sm font-medium text-[#F5F2EE] transition-colors hover:bg-[#5A534A]"
								>
									Start a conversation
								</a>
								<a
									href="/showcase"
									className="font-links-body rounded-sm border border-[#C9C0B6] px-5 py-2.5 text-sm text-[#3D3832] transition-colors hover:border-[#3D3832]"
								>
									Read case studies
								</a>
							</div>
							<div className="mt-8 grid grid-cols-3 gap-3">
								<div className="h-16 rounded-sm bg-[#EDE8E0]" />
								<div className="h-16 rounded-sm bg-[#C9C0B6]" />
								<div className="h-16 rounded-sm bg-[#8BA89B]" />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Theme 3: Tee Box Classic */}
			<section className="bg-white px-6 py-24">
				<div className="mx-auto max-w-5xl">
					<div className="mb-12 flex items-baseline gap-4">
						<span className="text-xs tracking-[0.2em] text-[#8B7E6A] uppercase">
							03
						</span>
						<div>
							<h2 className="font-tee-head text-3xl font-semibold text-[#1A1A1A]">
								Tee Box Classic
							</h2>
							<p className="font-tee-body mt-1 text-sm text-[#8B7E6A]">
								Crisp white, warm stone, forest green accent. Maximum breathing
								room.
							</p>
						</div>
					</div>

					<div className="grid gap-8 md:grid-cols-2">
						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full border border-[#E5E0D8] bg-white shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#1A1A1A]">
										Flag White
									</p>
									<p className="font-mono text-xs text-[#8B7E6A]">#FFFFFF</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full border border-[#E5E0D8] bg-[#F5F0E8] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#1A1A1A]">
										Bunker Stone
									</p>
									<p className="font-mono text-xs text-[#8B7E6A]">#F5F0E8</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#1B4332] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#1A1A1A]">
										Pine Green
									</p>
									<p className="font-mono text-xs text-[#8B7E6A]">#1B4332</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#8B7E6A] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#1A1A1A]">
										Fairway Taupe
									</p>
									<p className="font-mono text-xs text-[#8B7E6A]">#8B7E6A</p>
								</div>
							</div>
						</div>

						<div className="rounded-3xl border border-[#EDE9E2] bg-[#FAFAF8] p-10">
							<p className="font-tee-body mb-6 text-xs tracking-[0.25em] text-[#8B7E6A] uppercase">
								Hello, I'm Alex
							</p>
							<h3 className="font-tee-head mb-6 text-5xl leading-[1.1] text-[#1A1A1A]">
								I build
								<br />
								digital products.
							</h3>
							<div className="mb-6 h-[2px] w-12 bg-[#1B4332]" />
							<p className="font-tee-body mb-8 leading-relaxed text-[#8B7E6A]">
								Full-stack engineer with a designer's eye. Currently taking on
								select projects for Q2 2026.
							</p>
							<div className="space-y-3">
								<a
									href="/showcase"
									className="font-tee-body flex items-center justify-between border-b border-[#EDE9E2] py-3 text-[#1A1A1A] transition-colors hover:text-[#1B4332]"
								>
									<span className="text-sm">View my work</span>
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
								<a
									href="/showcase"
									className="font-tee-body flex items-center justify-between border-b border-[#EDE9E2] py-3 text-[#1A1A1A] transition-colors hover:text-[#1B4332]"
								>
									<span className="text-sm">About my process</span>
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
								<a
									href="/showcase"
									className="font-tee-body flex items-center justify-between py-3 text-[#1A1A1A] transition-colors hover:text-[#1B4332]"
								>
									<span className="text-sm">Get in touch</span>
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

			{/* Theme 4: Dew Point */}
			<section className="relative overflow-hidden bg-[#EEF1F0] px-6 py-24">
				<div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-white opacity-40 blur-3xl" />
				<div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#C5D5D1] opacity-20 blur-3xl" />
				<div className="relative z-10 mx-auto max-w-5xl">
					<div className="mb-12 flex items-baseline gap-4">
						<span className="text-xs tracking-[0.2em] text-[#7A9191] uppercase">
							04
						</span>
						<div>
							<h2 className="font-dew-head text-3xl font-semibold text-[#2C3E3E]">
								Dew Point
							</h2>
							<p className="font-dew-body mt-1 text-sm text-[#7A9191]">
								Morning mist, silvery blues, pale mint. Serene and luminous.
							</p>
						</div>
					</div>

					<div className="grid gap-8 md:grid-cols-2">
						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<div className="dew-shimmer h-16 w-16 rounded-full border border-[#C5D5D1] bg-[#EEF1F0] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#2C3E3E]">
										Morning Mist
									</p>
									<p className="font-mono text-xs text-[#7A9191]">#EEF1F0</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#C5D5D1] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#2C3E3E]">
										Pond Water
									</p>
									<p className="font-mono text-xs text-[#7A9191]">#C5D5D1</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#A8C5BF] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#2C3E3E]">
										Pale Mint
									</p>
									<p className="font-mono text-xs text-[#7A9191]">#A8C5BF</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#2C3E3E] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#2C3E3E]">
										Evergreen Shadow
									</p>
									<p className="font-mono text-xs text-[#7A9191]">#2C3E3E</p>
								</div>
							</div>
						</div>

						<div className="rounded-2xl border border-white bg-white/60 p-8 shadow-sm backdrop-blur-sm">
							<div className="mb-6 flex items-center gap-2">
								<div className="h-2 w-2 rounded-full bg-[#A8C5BF]" />
								<span className="font-dew-body text-xs tracking-[0.2em] text-[#7A9191] uppercase">
									Services
								</span>
							</div>
							<h3 className="font-dew-head mb-6 text-3xl leading-tight text-[#2C3E3E]">
								What I can
								<br />
								help you with
							</h3>
							<div className="space-y-4">
								<div className="flex items-start gap-4 rounded-xl border border-[#C5D5D1]/30 bg-white/50 p-4">
									<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#A8C5BF]/20">
										<svg
											className="h-5 w-5 text-[#2C3E3E]"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={1.5}
												d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
											/>
										</svg>
									</div>
									<div>
										<p className="font-dew-body text-sm font-medium text-[#2C3E3E]">
											Frontend Architecture
										</p>
										<p className="font-dew-body mt-0.5 text-xs text-[#7A9191]">
											React, TypeScript, design systems
										</p>
									</div>
								</div>
								<div className="flex items-start gap-4 rounded-xl border border-[#C5D5D1]/30 bg-white/50 p-4">
									<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#A8C5BF]/20">
										<svg
											className="h-5 w-5 text-[#2C3E3E]"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={1.5}
												d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
											/>
										</svg>
									</div>
									<div>
										<p className="font-dew-body text-sm font-medium text-[#2C3E3E]">
											Full-Stack Products
										</p>
										<p className="font-dew-body mt-0.5 text-xs text-[#7A9191]">
											End-to-end from database to UI
										</p>
									</div>
								</div>
								<div className="flex items-start gap-4 rounded-xl border border-[#C5D5D1]/30 bg-white/50 p-4">
									<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#A8C5BF]/20">
										<svg
											className="h-5 w-5 text-[#2C3E3E]"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={1.5}
												d="M13 10V3L4 14h7v7l9-11h-7z"
											/>
										</svg>
									</div>
									<div>
										<p className="font-dew-body text-sm font-medium text-[#2C3E3E]">
											Performance & Scale
										</p>
										<p className="font-dew-body mt-0.5 text-xs text-[#7A9191]">
											Speed audits, infrastructure
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Theme 5: Caddie Notebook */}
			<section className="bg-[#F3F1ED] px-6 py-24">
				<div className="mx-auto max-w-5xl">
					<div className="mb-12 flex items-baseline gap-4">
						<span className="text-xs tracking-[0.2em] text-[#8C857B] uppercase">
							05
						</span>
						<div>
							<h2 className="font-caddie-head text-3xl font-medium text-[#2B2824]">
								Caddie Notebook
							</h2>
							<p className="font-caddie-body mt-1 text-sm text-[#8C857B]">
								Utility and warmth. Cream paper, pencil marks, grid lines.
							</p>
						</div>
					</div>

					<div className="grid gap-8 md:grid-cols-2">
						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full border border-[#D4CFC7] bg-[#F3F1ED] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#2B2824]">
										Scorecard Cream
									</p>
									<p className="font-mono text-xs text-[#8C857B]">#F3F1ED</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#D4CFC7] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#2B2824]">
										Pencil Lead
									</p>
									<p className="font-mono text-xs text-[#8C857B]">#D4CFC7</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#B8A99A] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#2B2824]">
										Leather Grip
									</p>
									<p className="font-mono text-xs text-[#8C857B]">#B8A99A</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-[#2B2824] shadow-sm" />
								<div>
									<p className="text-sm font-medium text-[#2B2824]">
										Fresh Ink
									</p>
									<p className="font-mono text-xs text-[#8C857B]">#2B2824</p>
								</div>
							</div>
						</div>

						<div
							className="relative bg-white p-8 shadow-sm"
							style={{
								backgroundImage:
									'linear-gradient(#E8E4DE 1px, transparent 1px)',
								backgroundSize: '100% 28px',
							}}
						>
							<div className="absolute top-0 bottom-0 left-8 w-[1px] bg-[#E8E4DE]" />
							<div className="pl-6">
								<p className="font-caddie-body mb-6 text-xs tracking-[0.15em] text-[#8C857B] uppercase">
									Yardage Book
								</p>
								<h3 className="font-caddie-head mb-2 text-2xl text-[#2B2824]">
									Project Notes
								</h3>
								<p className="font-caddie-body mb-8 text-sm text-[#8C857B]">
									A running log of work, thoughts, and useful tools.
								</p>

								<div className="space-y-6">
									<div className="flex items-start gap-4">
										<span className="mt-0.5 font-mono text-xs text-[#B8A99A]">
											01
										</span>
										<div>
											<p className="font-caddie-body text-sm font-medium text-[#2B2824]">
												E-commerce Platform Rebuild
											</p>
											<p className="font-caddie-body mt-1 text-xs text-[#8C857B]">
												Next.js, Stripe, headless CMS — 40% faster checkout
											</p>
										</div>
									</div>
									<div className="flex items-start gap-4">
										<span className="mt-0.5 font-mono text-xs text-[#B8A99A]">
											02
										</span>
										<div>
											<p className="font-caddie-body text-sm font-medium text-[#2B2824]">
												Design System for Fintech
											</p>
											<p className="font-caddie-body mt-1 text-xs text-[#8C857B]">
												40+ components, Storybook, accessibility-first
											</p>
										</div>
									</div>
									<div className="flex items-start gap-4">
										<span className="mt-0.5 font-mono text-xs text-[#B8A99A]">
											03
										</span>
										<div>
											<p className="font-caddie-body text-sm font-medium text-[#2B2824]">
												Real-Time Dashboard
											</p>
											<p className="font-caddie-body mt-1 text-xs text-[#8C857B]">
												WebSockets, D3 charts, 10k concurrent users
											</p>
										</div>
									</div>
								</div>

								<div className="mt-8 border-t border-[#E8E4DE] pt-4">
									<a
										href="/showcase"
										className="font-caddie-body flex items-center gap-2 text-sm text-[#2B2824] transition-colors hover:text-[#B8A99A]"
									>
										See full yardage book
										<span className="text-lg">→</span>
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Comparison / Recommendation */}
			<section className="bg-[#1A1A1A] px-6 py-24 text-white">
				<div className="mx-auto max-w-4xl text-center">
					<p className="mb-6 text-xs tracking-[0.3em] text-neutral-500 uppercase">
						My Suggestion
					</p>
					<h2
						className="mb-8 text-4xl font-light"
						style={{ fontFamily: "'Cormorant Garamond', serif" }}
					>
						Start with <em className="text-[#A8C5BF]">Dew Point</em> or{' '}
						<em className="text-[#6B7F5E]">Fairway Fresh</em>
					</h2>
					<p className="mx-auto mb-12 max-w-2xl leading-relaxed text-neutral-400">
						Both feel unmistakably &quot;golf course&quot; without being
						on-the-nose. Dew Point leans ethereal and memorable. Fairway Fresh
						is the safest crowd-pleaser — clean, friendly, and confident. Tee
						Box Classic if you want maximum professionalism with zero risk.
						Links Minimal if you want texture and edge. Caddie Notebook if you
						want to stand out as the thinking-person&apos;s developer.
					</p>
					<div className="flex flex-wrap justify-center gap-4 text-sm">
						<span className="rounded-full border border-neutral-700 px-4 py-2 text-neutral-400">
							Light neutrals ✓
						</span>
						<span className="rounded-full border border-neutral-700 px-4 py-2 text-neutral-400">
							Crisp typography ✓
						</span>
						<span className="rounded-full border border-neutral-700 px-4 py-2 text-neutral-400">
							Not fashion-luxury ✓
						</span>
						<span className="rounded-full border border-neutral-700 px-4 py-2 text-neutral-400">
							Golf course soul ✓
						</span>
					</div>
				</div>
			</section>
		</div>
	)
}
