import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/')({
	component: Index,
})

const HEART_EMOJIS = ['❤️', '💕', '💖', '💗', '💘', '💝', '💓', '💞', '🩷']
const SIZES = [
	'text-xl',
	'text-2xl',
	'text-3xl',
	'text-4xl',
	'text-5xl',
	'text-6xl',
]

interface Particle {
	id: number
	x: number
	y: number
	emoji: string
	delay: number
	size: string
	duration: number
}

function Index() {
	const [clicks, setClicks] = useState(0)
	const [exploded, setExploded] = useState(false)
	const [particles, setParticles] = useState<Particle[]>([])
	const [shaking, setShaking] = useState(false)
	const [flashing, setFlashing] = useState(false)

	const scale = 1 + clicks * 0.2

	function handleYes() {
		const next = clicks + 1
		setClicks(next)

		if (next >= 5) {
			setShaking(true)
			setFlashing(true)

			// Wave 1: initial burst — fast, close
			const wave1: Particle[] = Array.from({ length: 30 }, (_, i) => ({
				id: i,
				x: (Math.random() - 0.5) * 800,
				y: (Math.random() - 0.5) * 800,
				emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
				delay: Math.random() * 0.15,
				size: SIZES[Math.floor(Math.random() * SIZES.length)],
				duration: 0.8 + Math.random() * 0.4,
			}))

			// Wave 2: bigger spread, slightly delayed
			const wave2: Particle[] = Array.from({ length: 30 }, (_, i) => ({
				id: i + 30,
				x: (Math.random() - 0.5) * 1600,
				y: (Math.random() - 0.5) * 1600,
				emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
				delay: 0.2 + Math.random() * 0.3,
				size: SIZES[Math.floor(Math.random() * SIZES.length)],
				duration: 1.0 + Math.random() * 0.6,
			}))

			// Wave 3: full-screen rain
			const wave3: Particle[] = Array.from({ length: 30 }, (_, i) => ({
				id: i + 60,
				x: (Math.random() - 0.5) * 2400,
				y: (Math.random() - 0.5) * 2400,
				emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
				delay: 0.5 + Math.random() * 0.5,
				size: SIZES[Math.floor(Math.random() * SIZES.length)],
				duration: 1.2 + Math.random() * 0.8,
			}))

			setParticles([...wave1, ...wave2, ...wave3])
			setTimeout(() => setFlashing(false), 400)
			setTimeout(() => setShaking(false), 600)
			setTimeout(() => setExploded(true), 2500)
		}
	}

	if (exploded) {
		return (
			<div className="paper-texture flex min-h-screen flex-col items-center justify-center px-4">
				<div className="animate-fade-up flex flex-col items-center gap-8">
					<img
						src="https://media1.tenor.com/m/AEQdP5OKt6IAAAAC/be-my-valentine-valentines-day.gif"
						alt="Happy Valentine's Day penguins"
						className="shadow-warm-lg h-64 w-64 rounded-2xl"
					/>
					<h1 className="text-primary text-center text-5xl font-bold md:text-6xl">
						Yay! Happy Valentine's Day!
					</h1>
				</div>
			</div>
		)
	}

	return (
		<div
			className={`paper-texture flex min-h-screen flex-col items-center justify-center px-4 ${shaking ? 'animate-shake' : ''}`}
		>
			{/* Flash overlay */}
			{flashing && (
				<div className="animate-flash pointer-events-none fixed inset-0 z-50 bg-pink-200" />
			)}

			<div className="animate-gentle-float mb-8 text-6xl">
				<HeartIcon />
			</div>

			<h1 className="animate-fade-up text-primary mb-12 text-center text-5xl font-bold md:text-6xl">
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
						className={`pointer-events-none absolute top-1/2 left-1/2 ${p.size}`}
						style={{
							animation: `explode ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
							['--tx' as string]: `${p.x}px`,
							['--ty' as string]: `${p.y}px`,
						}}
					>
						{p.emoji}
					</span>
				))}

				<button
					onClick={handleYes}
					style={{
						transform: `scale(${scale})`,
						animation:
							clicks > 0
								? `button-shake ${0.5 - clicks * 0.08}s ease-in-out infinite`
								: undefined,
					}}
					className="bg-primary text-primary-foreground shadow-warm hover:shadow-warm-lg cursor-pointer rounded-lg px-8 py-3 text-lg font-semibold transition-all duration-200 hover:-translate-y-0.5"
				>
					Yes
				</button>
				<button
					onClick={handleYes}
					className="bg-foreground text-background shadow-warm hover:shadow-warm-lg cursor-pointer rounded-lg px-8 py-3 text-lg font-semibold transition-all duration-200 hover:-translate-y-0.5"
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
			className="text-primary h-16 w-16"
		>
			<path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
		</svg>
	)
}
