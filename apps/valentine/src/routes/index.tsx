import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/')({
	component: Index,
})

const HEART_EMOJIS = ['❤️', '💕', '💖', '💗', '💘', '💝', '💓', '💞', '🩷']

function Index() {
	const [clicks, setClicks] = useState(0)
	const [exploded, setExploded] = useState(false)
	const [particles, setParticles] = useState<
		Array<{ id: number; x: number; y: number; emoji: string; delay: number }>
	>([])

	const scale = 1 + clicks * 0.2

	function handleYes() {
		const next = clicks + 1
		setClicks(next)

		if (next >= 5) {
			// spawn heart particles then transition
			const hearts = Array.from({ length: 20 }, (_, i) => ({
				id: i,
				x: (Math.random() - 0.5) * 600,
				y: (Math.random() - 0.5) * 600,
				emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
				delay: Math.random() * 0.3,
			}))
			setParticles(hearts)
			setTimeout(() => setExploded(true), 800)
		}
	}

	if (exploded) {
		return (
			<div className="paper-texture flex min-h-screen flex-col items-center justify-center px-4">
				<div className="animate-fade-up flex flex-col items-center gap-8">
					<img
						src="https://media1.tenor.com/m/AEQdP5OKt6IAAAAC/be-my-valentine-valentines-day.gif"
						alt="Happy Valentine's Day penguins"
						className="h-64 w-64 rounded-2xl shadow-warm-lg"
					/>
					<h1 className="text-center text-5xl font-bold text-primary md:text-6xl">
						Yay! Happy Valentine's Day!
					</h1>
				</div>
			</div>
		)
	}

	return (
		<div className="paper-texture flex min-h-screen flex-col items-center justify-center px-4">
			<div className="animate-gentle-float mb-8 text-6xl">
				<HeartIcon />
			</div>

			<h1 className="animate-fade-up mb-12 text-center text-5xl font-bold text-primary md:text-6xl">
				Will you be my Valentine?
			</h1>

			<div
				className="animate-fade-up relative flex gap-6"
				style={{ animationDelay: '0.2s' }}
			>
				{/* Explosion particles */}
				{particles.map((p) => (
					<span
						key={p.id}
						className="pointer-events-none absolute left-1/2 top-1/2 text-2xl"
						style={{
							animation: `explode 0.8s ease-out ${p.delay}s forwards`,
							['--tx' as string]: `${p.x}px`,
							['--ty' as string]: `${p.y}px`,
						}}
					>
						{p.emoji}
					</span>
				))}

				<button
					onClick={handleYes}
					style={{ transform: `scale(${scale})` }}
					className="cursor-pointer rounded-lg bg-primary px-8 py-3 text-lg font-semibold text-primary-foreground shadow-warm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-warm-lg"
				>
					Yes
				</button>
				<button
					disabled
					className="cursor-not-allowed rounded-lg bg-primary/30 px-8 py-3 text-lg font-semibold text-primary-foreground/50 shadow-warm"
				>
					No
				</button>
			</div>
		</div>
	)
}

function HeartIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			className="h-16 w-16 text-primary"
		>
			<path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
		</svg>
	)
}
