import { EventCard } from '#/components/event-card'
import { Header } from '#/components/header'
import { events, groupByYear } from '#/lib/events'
import { Badge } from '@aamini/ui/components/badge'
import { createFileRoute } from '@tanstack/react-router'
import { Calendar } from 'lucide-react'

export const Route = createFileRoute('/')({
	component: Index,
})

function Index() {
	return (
		<>
			{/* Enhanced dark background with multiple layers */}
			<div className="fixed inset-0 -z-10 bg-linear-to-br from-gray-900 via-black to-gray-800" />
			<div className="fixed inset-0 -z-10 bg-linear-to-t from-black/20 via-transparent to-black/40" />

			<div className="flex min-h-screen flex-col">
				<Header />

				<main id="content">
					{/* Hero Section */}
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
								{/* Title Glow Effect */}
								<div className="absolute inset-0 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 blur-xl transition-opacity duration-500" />
							</div>

							<div className="space-y-4">
								{/* Sub-Title */}
								<h1 className="font-hero-title text-3xl leading-tight font-bold text-white sm:text-4xl md:text-5xl">
									<span className="bg-linear-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
										An international community,
									</span>
									<br />
									<span className="bg-linear-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
										Your best international festivals
									</span>
								</h1>

								{/* Description */}
								<p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
									Join us for unforgettable experiences, incredible music, and
									connections that last a lifetime.
								</p>
							</div>

							{/* Placeholder Button for Next Event */}
							<div className="pt-4">
								<div className="inline-flex cursor-default items-center gap-2 rounded-full border border-gray-700/50 bg-linear-to-r from-gray-800/50 to-gray-900/50 px-6 py-3 text-base font-semibold text-gray-400 shadow-lg shadow-gray-900/20 backdrop-blur-sm sm:gap-3 sm:px-8 sm:py-4 sm:text-lg">
									<Calendar className="h-5 w-5" />
									<span className="whitespace-nowrap">
										Next event coming soon
									</span>
								</div>
							</div>
						</div>
					</section>

					{/* Ducky Events */}
					<section
						id="duckyevents"
						className="border-t px-4 py-20 sm:px-6 lg:px-8"
					>
						<div className="mx-auto max-w-7xl">
							{/* Section Header */}
							<div className="mb-16 text-center">
								<h2 className="mb-4 bg-linear-to-r from-white via-white to-gray-300 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
									Ducky Events
								</h2>
								<p className="mx-auto max-w-2xl text-lg text-gray-400">
									Discover the magic moments from our unforgettable events
								</p>
							</div>

							{/* Events by Year */}
							<div className="space-y-16">
								{groupByYear(events).map(([year, yearEvents]) => (
									<div key={year} className="relative last:*:last:hidden">
										{/* Year Badge */}
										<div className="mb-12 flex items-center justify-center">
											<Badge
												variant="outline"
												className="border-blue-400/30 bg-linear-to-r from-blue-500/20 to-purple-500/20 px-8 py-3 text-xl font-bold text-white backdrop-blur-sm"
											>
												{year}
											</Badge>
										</div>

										{/* Events Grid */}
										<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
											{yearEvents.map((event) => (
												<EventCard key={event.id} event={event} />
											))}
										</div>

										{/* Divider line for all but last group */}
										<div className="mt-16 flex justify-center">
											<div className="h-px w-32 bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
										</div>
									</div>
								))}
							</div>
						</div>
					</section>

					{/* Aftermovie */}
					<section
						id="duckyfest2023-aftermovie"
						className="px-4 py-16 sm:px-6 lg:px-8"
					>
						<div className="mx-auto max-w-6xl">
							<h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
								ducky.fest 2023 | Aftermovie
							</h2>
							<div className="relative mb-12 aspect-video w-full overflow-hidden rounded-lg bg-black">
								<iframe
									className="h-full w-full"
									src="https://www.youtube.com/embed/krrw6ylZecQ"
									title="ducky.fest 2023 | Official Aftermovie"
									frameBorder="0"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
									allowFullScreen
								/>
							</div>

							<h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
								ducky.ROOM 2023 | Aftermovie
							</h2>
							<div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
								<iframe
									className="h-full w-full"
									src="https://www.youtube.com/embed/7WxpKu7bFm8"
									title="Ducky.Room After-Movie (Part 1)"
									frameBorder="0"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
									allowFullScreen
								/>
							</div>
						</div>
					</section>

					{/* Our Mission */}
					<section id="about-us" className="px-4 py-16 sm:px-6 lg:px-8">
						<div className="mx-auto max-w-4xl">
							<h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
								our mission
							</h2>
							<div className="space-y-4 leading-relaxed text-gray-200">
								<p>
									Our mission is to create the best festival experience possible
									for all young adults - not just new internationals or Dutch
									students from university.
								</p>
								<p>
									We are actively bridging this gap through frequent events that
									host local and international artists alike. For instance, our
									most recent annual festival hosted DJ's from 10 different
									nationalities, and this is reflected in the diversity of our
									audience.
								</p>
							</div>
						</div>
					</section>

					{/* Business Inquiries */}
					<section
						id="business-inquiries"
						className="px-4 py-16 sm:px-6 lg:px-8"
					>
						<div className="mx-auto max-w-4xl">
							<h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
								business inquiries
							</h2>
							<p className="leading-relaxed text-gray-200">
								We are happy to collaborate with you. Feel free to download the
								brochure to learn more about us and see if we are good fit!
							</p>

							<div className="mt-6">
								<a
									href="https://duckymot.com/wp-content/uploads/2023/11/Ducky-Brochure.pdf"
									className="inline-flex items-center rounded-md border border-yellow-400 px-4 py-2 font-semibold text-yellow-400 transition-colors hover:bg-yellow-400/10"
									target="_blank"
									rel="noopener noreferrer"
								>
									BROCHURE DOWNLOAD
								</a>
							</div>
						</div>
					</section>
				</main>

				{/* Footer */}
				<footer className="border-t border-gray-800 bg-black">
					<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
						<div className="mt-4 text-sm text-gray-400">
							Copyright © 2025 DuckyMot
						</div>
					</div>
				</footer>
			</div>
		</>
	)
}
