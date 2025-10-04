'use client'

import { cn } from '@aamini/ui/lib/utils'
import { useEffect, useState } from 'react'

export function PremiumPrankHero() {
	const [mounted, setMounted] = useState(false)
	const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 })

	useEffect(() => {
		setMounted(true)

		const handleMouseMove = (e: MouseEvent) => {
			const x = (e.clientX / window.innerWidth) * 100
			const y = (e.clientY / window.innerHeight) * 100
			setGlowPosition({ x, y })
		}

		window.addEventListener('mousemove', handleMouseMove)
		return () => window.removeEventListener('mousemove', handleMouseMove)
	}, [])

	return (
		<section className="relative min-h-screen w-full overflow-hidden bg-black">
			{/* Animated gradient background with mouse tracking */}
			<div
				className="pointer-events-none absolute inset-0 opacity-50 transition-opacity duration-1000"
				style={{
					background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(147, 51, 234, 0.15) 0%, rgba(59, 130, 246, 0.1) 25%, transparent 50%)`,
				}}
			/>

			{/* Base gradient layers */}
			<div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
			<div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-purple-950/30" />

			{/* Animated mesh gradient */}
			<div className="absolute inset-0 opacity-30">
				<div
					className={cn(
						'absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-purple-600/30 blur-3xl transition-all duration-[3000ms] ease-in-out',
						mounted ? 'scale-150 opacity-40' : 'scale-100 opacity-20',
					)}
				/>
				<div
					className={cn(
						'absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl transition-all delay-500 duration-[3000ms] ease-in-out',
						mounted ? 'scale-150 opacity-40' : 'scale-100 opacity-20',
					)}
				/>
				<div
					className={cn(
						'absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-3xl transition-all delay-1000 duration-[3000ms] ease-in-out',
						mounted ? 'scale-200 opacity-30' : 'scale-100 opacity-10',
					)}
				/>
			</div>

			{/* Floating particles */}
			<div className="absolute inset-0">
				{[...Array(30)].map((_, i) => (
					<div
						key={i}
						className="absolute h-1 w-1 rounded-full bg-white/20"
						style={{
							left: `${Math.random() * 100}%`,
							top: `${Math.random() * 100}%`,
							animation: `float ${15 + Math.random() * 20}s infinite ease-in-out`,
							animationDelay: `${Math.random() * 5}s`,
						}}
					/>
				))}
			</div>

			{/* Main content */}
			<div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-20 sm:px-12 md:px-16 lg:px-24">
				<div className="w-full max-w-6xl">
					{/* Premium glass container */}
					<div
						className={cn(
							'group relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-12 shadow-2xl backdrop-blur-2xl transition-all duration-1000 md:p-16 lg:p-20',
							mounted
								? 'translate-y-0 opacity-100'
								: 'translate-y-12 opacity-0',
						)}
					>
						{/* Shimmer effect */}
						<div className="absolute inset-0 overflow-hidden rounded-3xl">
							<div
								className={cn(
									'absolute -inset-full top-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-1000',
									mounted ? 'animate-shimmer' : '',
								)}
							/>
						</div>

						{/* Inner glow */}
						<div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

						{/* Content */}
						<div className="relative space-y-8">
							{/* Decorative top accent */}
							<div
								className={cn(
									'mx-auto mb-12 h-1 w-20 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 transition-all duration-1000 delay-300',
									mounted ? 'w-32 opacity-100' : 'w-0 opacity-0',
								)}
							/>

							{/* Main text */}
							<h1
								className={cn(
									'text-center font-bold leading-[1.1] tracking-tight transition-all duration-1000 delay-500',
									mounted
										? 'translate-y-0 opacity-100'
										: 'translate-y-8 opacity-0',
								)}
							>
								<span className="block bg-gradient-to-br from-white via-white to-gray-300 bg-clip-text text-5xl text-transparent sm:text-6xl md:text-7xl lg:text-8xl">
									Say sorry
								</span>
								<span className="mt-4 block bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-5xl text-transparent sm:text-6xl md:text-7xl lg:text-8xl">
									and that I'm more
								</span>
								<span className="relative mt-4 inline-block">
									<span className="relative z-10 bg-gradient-to-br from-purple-300 via-blue-300 to-purple-300 bg-clip-text text-6xl text-transparent sm:text-7xl md:text-8xl lg:text-9xl">
										cracked
									</span>
									{/* Glow effect under "cracked" */}
									<div className="absolute -inset-x-4 bottom-0 top-1/2 -z-10 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 blur-3xl" />
								</span>
								<span className="mt-4 block bg-gradient-to-br from-white via-white to-gray-300 bg-clip-text text-5xl text-transparent sm:text-6xl md:text-7xl lg:text-8xl">
									than Kube
								</span>
							</h1>

							{/* Decorative bottom accent */}
							<div
								className={cn(
									'mx-auto mt-12 h-1 w-20 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 transition-all duration-1000 delay-700',
									mounted ? 'w-32 opacity-100' : 'w-0 opacity-0',
								)}
							/>

						</div>
					</div>

				</div>
			</div>

			{/* Bottom gradient fade */}
			<div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />

			{/* CSS animations */}
			<style>{`
				@keyframes float {
					0%, 100% {
						transform: translate(0, 0) scale(1);
						opacity: 0;
					}
					10% {
						opacity: 0.3;
					}
					50% {
						transform: translate(calc(var(--tw-translate-x) + 100px), calc(var(--tw-translate-y) - 100px)) scale(1.5);
						opacity: 0.6;
					}
					90% {
						opacity: 0.3;
					}
				}

				@keyframes shimmer {
					0% {
						transform: translateX(-100%);
					}
					100% {
						transform: translateX(100%);
					}
				}

				@keyframes scroll-indicator {
					0%, 100% {
						opacity: 0;
						transform: translateY(0);
					}
					50% {
						opacity: 1;
						transform: translateY(16px);
					}
				}

				.animate-shimmer {
					animation: shimmer 3s infinite;
				}

				.animate-scroll-indicator {
					animation: scroll-indicator 2s infinite ease-in-out;
				}

				/* Smooth text rendering */
				h1 {
					-webkit-font-smoothing: antialiased;
					-moz-osx-font-smoothing: grayscale;
					text-rendering: optimizeLegibility;
				}
			`}</style>
		</section>
	)
}
