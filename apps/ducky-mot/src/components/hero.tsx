import { Button } from '@aamini/ui/components/button'
import { ArrowRight, Ticket } from 'lucide-react'

export function Hero() {
	return (
		<section className="relative flex min-h-screen items-start justify-center px-4 py-20 sm:px-6 lg:px-8">
			<div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/80 to-black" />
			<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -right-40 -top-40 h-80 w-80 animate-pulse rounded-full bg-blue-500/5 blur-3xl" />
				<div className="absolute -bottom-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-purple-500/5 blur-3xl [animation-delay:2s]" />
			</div>
			<div className="spinning-duck absolute inset-0 bg-transparent opacity-10"></div>

			<div className="relative z-10 mx-auto max-w-4xl space-y-8 text-center">
				{/* Title (ducky.mot) */}
				<div className="group relative">
					<img
						src="https://duckymot.com/wp-content/uploads/2023/08/Asset-2.svg"
						alt="DuckyMot logo"
						className="mx-auto h-24 w-auto sm:h-32 md:h-36"
						loading="lazy"
					/>
					{/* Glow */}
					<div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 blur-xl transition-opacity duration-500" />
				</div>

				{/* Sub-Header */}
				<div className="space-y-4">
					<h1 className="font-hero-title text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
						<span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
							An international community,
						</span>
						<br />
						<span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
							for students, by students.
						</span>
					</h1>

					<p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
						Join us for unforgettable experiences, incredible music, and
						connections that last a lifetime.
					</p>
				</div>

				{/* Ticket Button */}
				<div className="pt-4">
					<Button
						asChild
						size="lg"
						className="group border-0 bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-blue-500/25 transition-all duration-300 hover:from-blue-600 hover:to-purple-700 hover:shadow-blue-500/40"
					>
						<a
							href="https://spaces.toffolo.studio/267526bf-c657-11ed-94ba-6a57c78572ab.html"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Ticket className="mr-2 h-5 w-5" />
							Get Tickets
							<ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
						</a>
					</Button>
				</div>
			</div>
		</section>
	)
}
