import { Badge } from '@aamini/ui/components/badge'
import { Card, CardContent } from '@aamini/ui/components/card'
import { ExternalLink } from 'lucide-react'

type EventItem = {
	date: string
	title: string
	href: string
	img: string
}

type YearGroup = {
	year: number
	items: EventItem[]
}

const eventsByYear: YearGroup[] = [
	{
		year: 2025,
		items: [
			{
				date: '17th May 2025',
				title: 'Ducky.fest',
				href: 'https://duckymot.com/photos-ducky-17th-may-2025',
				img: 'https://duckymot.com/wp-content/uploads/2025/09/DSC00243-1024x684.jpg',
			},
			{
				date: '22nd February 2025',
				title: 'Ducky.Lorre',
				href: 'https://duckymot.com/photos-ducky-lorre-2-02-2025',
				img: 'https://duckymot.com/wp-content/uploads/2025/03/feb2025-CAM1-Edited-1.2_237.jpg',
			},
		],
	},
	{
		year: 2024,
		items: [
			{
				date: '29th November 2024',
				title: 'Ducky.Room',
				href: 'https://duckymot.com/photos-ducky-room-29th-november-2024/',
				img: 'https://duckymot.com/wp-content/uploads/2025/01/DSC02952-scaled.jpg',
			},
			{
				date: '20th September 2024',
				title: 'Ducky.Fest',
				href: 'https://duckymot.com/photos-ducky-fest-20th-september-2024/',
				img: 'https://duckymot.com/wp-content/uploads/2024/10/IMG_8090-scaled.jpg',
			},
			{
				date: '1st June 2024',
				title: 'Ducky.Fest',
				href: 'https://duckymot.com/photos-ducky-fest-2024/',
				img: 'https://duckymot.com/wp-content/uploads/2024/08/DSC00278-scaled.jpg',
			},
		],
	},
	{
		year: 2023,
		items: [
			{
				date: '15th December 2023',
				title: 'Ducky.Room',
				href: 'https://duckymot.com/photos-ducky-room/',
				img: 'https://duckymot.com/wp-content/uploads/2024/01/DSC_8026-scaled.jpg',
			},
			{
				date: '23rd September 2023',
				title: 'Ducky.Fest',
				href: 'https://duckymot.com/photos-ducky-fest-2023/',
				img: 'https://duckymot.com/wp-content/uploads/2023/10/Main1-1024x683.jpg',
			},
			{
				date: '21st April 2023',
				title: 'Ducky.House',
				href: 'https://duckymot.com/photos-ducky-house/',
				img: 'https://duckymot.com/wp-content/uploads/2023/08/Photo2-1024x683.jpg',
			},
		],
	},
]

export function Events() {
	return (
		<section id="duckyevents" className="px-4 py-20 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-7xl">
				{/* Section Header */}
				<div className="mb-16 text-center">
					<h2 className="mb-4 bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text font-mono text-4xl font-bold text-transparent md:text-5xl">
						Ducky Events
					</h2>
					<p className="mx-auto max-w-2xl text-lg text-gray-400">
						Discover the magic moments from our unforgettable events
					</p>
				</div>

				{/* Events by Year */}
				<div className="space-y-16">
					{eventsByYear.map((group, groupIndex) => (
						<div key={group.year} className="relative">
							{/* Year Badge */}
							<div className="mb-12 flex items-center justify-center">
								<Badge
									variant="day"
									size="lg"
									className="border-blue-400/30 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-8 py-3 text-xl font-bold text-white backdrop-blur-sm"
								>
									{group.year}
								</Badge>
							</div>

							{/* Events Grid */}
							<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
								{group.items.map((event) => (
									<EventCard key={event.href} event={event} />
								))}
							</div>

							{/* Divider line for all but last group */}
							{groupIndex < eventsByYear.length - 1 && (
								<div className="mt-16 flex justify-center">
									<div className="h-px w-32 bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	)
}

function EventCard({ event }: { event: EventItem }) {
	return (
		<Card className="group/card overflow-hidden border-gray-700/50 bg-gray-900/50 backdrop-blur-sm transition-all duration-500 hover:border-gray-600/60 hover:bg-gray-800/60 hover:shadow-2xl hover:shadow-blue-500/10">
			<CardContent className="space-y-0 p-0">
				{/* Image Container */}
				<div className="relative overflow-hidden">
					<a
						href={event.href}
						target="_blank"
						rel="noopener noreferrer"
						className="block"
						aria-label={`View photos from ${event.title} - ${event.date}`}
					>
						<div className="aspect-[4/3] overflow-hidden bg-gray-800">
							<img
								src={event.img}
								alt={`${event.title} — ${event.date}`}
								className="h-full w-full object-cover transition-all duration-700 group-hover/card:scale-110"
								loading="lazy"
							/>
						</div>

						{/* Overlay with gradient */}
						<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />

						{/* External link icon */}
						<div className="absolute right-4 top-4 rounded-full bg-white/10 p-2 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover/card:bg-white/20 group-hover/card:opacity-100">
							<ExternalLink className="h-4 w-4 text-white" />
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
						href={event.href}
						target="_blank"
						rel="noopener noreferrer"
						className="group/link inline-flex items-center gap-2 text-sm text-blue-400 transition-colors duration-200 hover:text-blue-300"
					>
						<span>View Photos</span>
						<ExternalLink className="h-3 w-3 transition-transform duration-200 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
					</a>
				</div>
			</CardContent>
		</Card>
	)
}
