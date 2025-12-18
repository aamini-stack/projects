import { Calendar } from 'lucide-react'

export function Hero() {
	return (
		<section className="relative flex min-h-screen items-start justify-center px-4 py-20 sm:px-6 lg:px-8">
			<div className="absolute inset-0 bg-linear-to-br from-black via-gray-900/80 to-black" />
			<div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-black/20" />
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -right-40 h-80 w-80 animate-pulse rounded-full bg-blue-500/5 blur-3xl" />
				<div className="absolute -bottom-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-purple-500/5 blur-3xl [animation-delay:2s]" />
			</div>
			<div className="spinning-duck absolute inset-0 bg-transparent opacity-10" />

			<div className="relative z-10 mx-auto max-w-4xl space-y-8 text-center">
				{/* Title (ducky.mot) */}
				<div className="group relative">
					<img
						src="/title.svg"
						alt="DuckyMot logo"
						className="mx-auto h-24 w-auto sm:h-32 md:h-36"
					/>
					{/* Glow */}
					<div className="absolute inset-0 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 blur-xl transition-opacity duration-500" />
				</div>

				{/* Sub-Header */}
				<div className="space-y-4">
					<h1 className="font-hero-title text-3xl leading-tight font-bold text-white sm:text-4xl md:text-5xl">
						<span className="bg-linear-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
							An international community,
						</span>
						<br />
						<span className="bg-linear-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
							Your best international festivals
						</span>
					</h1>

					<p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
						Join us for unforgettable experiences, incredible music, and
						connections that last a lifetime.
					</p>
				</div>

				{/* Placeholder Button for Next Event */}
				<div className="pt-4">
					<div className="inline-flex cursor-default items-center gap-2 rounded-full border border-gray-700/50 bg-linear-to-r from-gray-800/50 to-gray-900/50 px-6 py-3 text-base font-semibold text-gray-400 shadow-lg shadow-gray-900/20 backdrop-blur-sm sm:gap-3 sm:px-8 sm:py-4 sm:text-lg">
						<Calendar className="h-5 w-5" />
						<span className="whitespace-nowrap">Next event coming soon</span>
					</div>
				</div>
			</div>
		</section>
	)
}
