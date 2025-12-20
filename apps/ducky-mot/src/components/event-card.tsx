import type { Event } from '#/lib/events'
import { Card, CardContent } from '@aamini/ui/components/card'
import { ExternalLink, Images } from 'lucide-react'

export function EventCard({ event }: { event: Event }) {
	const isLegacy = 'legacyHref' in event
	const href = isLegacy ? event.legacyHref : `/events/${event.id}`
	const linkTarget = isLegacy ? '_blank' : undefined
	const linkRel = isLegacy ? 'noopener noreferrer' : undefined
	const LinkIcon = isLegacy ? ExternalLink : Images

	return (
		<Card className="group/card overflow-hidden border-gray-700/50 bg-gray-900/50 backdrop-blur-sm transition-all duration-500 hover:border-gray-600/60 hover:bg-gray-800/60 hover:shadow-2xl hover:shadow-blue-500/10">
			<CardContent className="space-y-0 p-0">
				{/* Image Container */}
				<div className="relative overflow-hidden">
					<a
						href={href}
						target={linkTarget}
						rel={linkRel}
						className="block"
						aria-label={`View photos from ${event.title} - ${event.date}`}
					>
						<div className="aspect-4/3 overflow-hidden bg-gray-800">
							<img
								src={event.icon}
								alt={`${event.title} — ${event.date}`}
								className="h-full w-full object-cover transition-all duration-700 group-hover/card:scale-110"
								loading="lazy"
							/>
						</div>

						{/* Overlay with gradient */}
						<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />

						{/* Link icon */}
						<div className="absolute top-4 right-4 rounded-full bg-white/10 p-2 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover/card:bg-white/20 group-hover/card:opacity-100">
							<LinkIcon className="h-4 w-4 text-white" />
						</div>
					</a>
				</div>

				{/* Event Details */}
				<div className="space-y-3 p-6">
					<div className="flex items-start justify-between gap-3">
						<div className="flex-1 space-y-1">
							<h3 className="text-xl font-bold text-white transition-colors duration-300 group-hover/card:text-blue-300">
								{event.title}
							</h3>
							<p className="text-sm leading-relaxed text-gray-400">
								{event.date}
							</p>
						</div>
					</div>

					{/* View Photos Link */}
					<a
						href={href}
						target={linkTarget}
						rel={linkRel}
						className="group/link inline-flex items-center gap-2 text-sm text-blue-400 transition-colors duration-200 hover:text-blue-300"
					>
						<span>View Photos</span>
						<LinkIcon className="h-3 w-3 transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
					</a>
				</div>
			</CardContent>
		</Card>
	)
}

export function groupByYear(events: Event[]): Record<string, Event[]> {
	const grouped: Record<string, Event[]> = {}

	for (const event of events) {
		// Extract year from date string (assumes format like "19th September 2025")
		const yearMatch = event.date.match(/\b(\d{4})\b/)
		if (!yearMatch) continue

		const year = yearMatch[1]
		if (!grouped[year]) {
			grouped[year] = []
		}
		grouped[year].push(event)
	}

	// Sort events within each year by date (most recent first)
	for (const year in grouped) {
		grouped[year].sort((a, b) => {
			// Simple date comparison - could be improved with proper date parsing
			return b.date.localeCompare(a.date)
		})
	}

	return grouped
}
