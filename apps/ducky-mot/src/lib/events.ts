/** Legacy event that links to external WordPress gallery */
export type LegacyEvent = {
	id: string
	title: string
	date: string
	icon: string

	legacyHref: string
}

/** Modern event that links to internal gallery page */
export type ModernEvent = {
	id: string
	title: string
	date: string
	icon: string
}

export type Event = LegacyEvent | ModernEvent

import endlessSummerIcon from '@/assets/ducky-endless-summer-2025-09-19/gallery-item-001.jpg'

export const events: Event[] = [
	{
		id: 'ducky-endless-summer-2025-09-19',
		title: 'ducky.endless summer',
		date: '19th September 2025',
		icon: endlessSummerIcon,
	},
	{
		id: 'ducky.fest-2025-05-17',
		title: 'ducky.fest',
		date: '17th May 2025',
		legacyHref: 'https://duckymot.com/photos-ducky-17th-may-2025',
		icon: 'https://duckymot.com/wp-content/uploads/2025/09/DSC00243-1024x684.jpg',
	},
	{
		id: 'ducky.lorre-2025-02-22',
		title: 'ducky.lorre',
		date: '22nd February 2025',
		legacyHref: 'https://duckymot.com/photos-ducky-lorre-2-02-2025',
		icon: 'https://duckymot.com/wp-content/uploads/2025/03/feb2025-CAM1-Edited-1.2_237.jpg',
	},
	{
		id: 'ducky.room-2024-11-29',
		title: 'ducky.room',
		date: '29th November 2024',
		legacyHref: 'https://duckymot.com/photos-ducky-room-29th-november-2024/',
		icon: 'https://duckymot.com/wp-content/uploads/2025/01/DSC02952-scaled.jpg',
	},
	{
		id: 'ducky.fest-2024-09-20',
		title: 'ducky.fest',
		date: '20th September 2024',
		legacyHref: 'https://duckymot.com/photos-ducky-fest-20th-september-2024/',
		icon: 'https://duckymot.com/wp-content/uploads/2024/10/IMG_8090-scaled.jpg',
	},
	{
		id: 'ducky.fest-2024-06-01',
		title: 'ducky.fest',
		date: '1st June 2024',
		legacyHref: 'https://duckymot.com/photos-ducky-fest-2024/',
		icon: 'https://duckymot.com/wp-content/uploads/2024/08/DSC00278-scaled.jpg',
	},
	{
		id: 'ducky.room-2023-12-15',
		title: 'ducky.room',
		date: '15th December 2023',
		legacyHref: 'https://duckymot.com/photos-ducky-room/',
		icon: 'https://duckymot.com/wp-content/uploads/2024/01/DSC_8026-scaled.jpg',
	},
	{
		id: 'ducky.fest-2023-09-23',
		title: 'ducky.fest',
		date: '23rd September 2023',
		legacyHref: 'https://duckymot.com/photos-ducky-fest-2023/',
		icon: 'https://duckymot.com/wp-content/uploads/2023/10/Main1-1024x683.jpg',
	},
	{
		id: 'ducky.house-2023-04-21',
		title: 'ducky.house',
		date: '21st April 2023',
		legacyHref: 'https://duckymot.com/photos-ducky-house/',
		icon: 'https://duckymot.com/wp-content/uploads/2023/08/Photo2-1024x683.jpg',
	},
]

export type GalleryImage = {
	id: string
	src: string
	alt: string
	thumbnail?: string
}

export function groupByYear(events: Event[]): Array<[string, Event[]]> {
	const grouped: Record<string, Event[]> = {}

	// Extract date from last 10 characters of id (format: YYYY-MM-DD)
	const getDateFromId = (id: string): Date => {
		const dateStr = id.slice(-10) // e.g., "2025-09-19"
		return new Date(dateStr)
	}

	for (const event of events) {
		const eventDate = getDateFromId(event.id)
		const year = eventDate.getFullYear().toString()

		if (!grouped[year]) {
			grouped[year] = []
		}
		grouped[year].push(event)
	}

	// Sort events within each year by date (most recent first)
	for (const event of Object.values(grouped)) {
		event.sort((a, b) => {
			const dateA = getDateFromId(a.id)
			const dateB = getDateFromId(b.id)
			return dateB.getTime() - dateA.getTime()
		})
	}

	// Return as array of tuples sorted descending by year (2025 -> 2023)
	return Object.entries(grouped).sort(
		([yearA], [yearB]) => Number.parseInt(yearB) - Number.parseInt(yearA),
	)
}
