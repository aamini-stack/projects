import { Button } from '@aamini/ui/components/button'
import { ArrowRight, Ticket } from 'lucide-react'

export function Hero() {
	return (
		<section className="relative flex min-h-[60vh] items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
			{/* Background with enhanced gradients */}
			<div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/80 to-black" />
			<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
			</div>

			<div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">
				{/* Logo with enhanced styling */}
				<div className="relative group">
					<img
						src="https://duckymot.com/wp-content/uploads/2023/08/Asset-2.svg"
						alt="DuckyMot logo"
						className="mx-auto h-24 sm:h-32 md:h-36 w-auto opacity-95 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
						loading="lazy"
					/>
					{/* Subtle glow effect */}
					<div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
				</div>

				{/* Main headline with gradient text */}
				<div className="space-y-4">
					<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
						<span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
							An international community,
						</span>
						<br />
						<span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
							for students, by students.
						</span>
					</h1>

					<p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
						Join us for unforgettable experiences, incredible music, and
						connections that last a lifetime.
					</p>
				</div>

				{/* CTA Button with enhanced styling */}
				<div className="pt-4">
					<Button
						asChild
						size="lg"
						className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 group border-0"
					>
						<a
							href="https://spaces.toffolo.studio/267526bf-c657-11ed-94ba-6a57c78572ab.html"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Ticket className="w-5 h-5 mr-2" />
							Get Tickets
							<ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
						</a>
					</Button>
				</div>

				{/* Scroll indicator */}
				<div className="pt-8">
					<div className="animate-bounce">
						<div className="w-6 h-10 border-2 border-gray-400 rounded-full mx-auto flex justify-center">
							<div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse" />
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
