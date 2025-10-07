/**
 * Gallery data for Ducky Mot events
 *
 * This file contains the image galleries for events that have been
 * migrated from the legacy WordPress system to the modern in-app gallery.
 */

export type GalleryImage = {
	id: string
	src: string
	alt: string
	thumbnail?: string // Optional optimized thumbnail URL
}

export type EventGallery = {
	id: string
	slug: string // URL slug for the event (e.g., "ducky-fest-2025-05-17")
	eventTitle: string
	eventDate: string
	coverImage: string // Main event image
	images: GalleryImage[]
}

/**
 * Map of gallery ID to gallery data
 * Add new galleries here as events are migrated
 */
export const galleries: Record<string, EventGallery> = {
	'ducky-endless-summer-2025-09-19': {
		id: 'ducky-endless-summer-2025-09-19',
		slug: 'ducky-endless-summer-2025-09-19',
		eventTitle: 'ducky.endless summer',
		eventDate: '19th September 2025',
		coverImage: '/ducky-sept-2025/20200101-DSC00025_01.jpg',
		images: [
			{
				id: 'img-1',
				src: '/ducky-sept-2025/20200101-DSC00025_01.jpg',
				alt: 'Festival crowd at ducky.endless summer',
			},
			{
				id: 'img-2',
				src: '/ducky-sept-2025/20200101-DSC00055_01.jpg',
				alt: 'Live performance on stage',
			},
			{
				id: 'img-3',
				src: '/ducky-sept-2025/20200101-DSC00063_01.jpg',
				alt: 'Festival atmosphere',
			},
			{
				id: 'img-4',
				src: '/ducky-sept-2025/20200101-DSC00068_01.jpg',
				alt: 'Crowd enjoying the music',
			},
			{
				id: 'img-5',
				src: '/ducky-sept-2025/20200101-DSC00097_01.jpg',
				alt: 'Festival attendees dancing',
			},
			{
				id: 'img-6',
				src: '/ducky-sept-2025/20200101-DSC00101_01.jpg',
				alt: 'Stage performance',
			},
			{
				id: 'img-7',
				src: '/ducky-sept-2025/20200101-DSC00128_01.jpg',
				alt: 'Festival energy',
			},
			{
				id: 'img-8',
				src: '/ducky-sept-2025/20200101-DSC00131_01.jpg',
				alt: 'Crowd shots',
			},
			{
				id: 'img-9',
				src: '/ducky-sept-2025/20200101-DSC00135_01.jpg',
				alt: 'Festival vibes',
			},
			{
				id: 'img-10',
				src: '/ducky-sept-2025/20200101-DSC00136_01.jpg',
				alt: 'Attendees enjoying the festival',
			},
			{
				id: 'img-11',
				src: '/ducky-sept-2025/20200101-DSC00141_01.jpg',
				alt: 'Live music performance',
			},
			{
				id: 'img-12',
				src: '/ducky-sept-2025/20200101-DSC00143_01.jpg',
				alt: 'Festival crowd',
			},
			{
				id: 'img-13',
				src: '/ducky-sept-2025/20200101-DSC00158_01.jpg',
				alt: 'Dancing at the festival',
			},
			{
				id: 'img-14',
				src: '/ducky-sept-2025/20200101-DSC00171_01.jpg',
				alt: 'Stage lights and atmosphere',
			},
			{
				id: 'img-15',
				src: '/ducky-sept-2025/20200101-DSC00190_01.jpg',
				alt: 'Festival moments',
			},
			{
				id: 'img-16',
				src: '/ducky-sept-2025/20200101-DSC00193_01.jpg',
				alt: 'Crowd enjoying music',
			},
			{
				id: 'img-17',
				src: '/ducky-sept-2025/20200101-DSC00197_01.jpg',
				alt: 'Festival atmosphere',
			},
			{
				id: 'img-18',
				src: '/ducky-sept-2025/20200101-DSC00199_01.jpg',
				alt: 'Live performance',
			},
			{
				id: 'img-19',
				src: '/ducky-sept-2025/20200101-DSC00213_01.jpg',
				alt: 'Festival crowd dancing',
			},
			{
				id: 'img-20',
				src: '/ducky-sept-2025/20200101-DSC00221_01.jpg',
				alt: 'Stage performance',
			},
			{
				id: 'img-21',
				src: '/ducky-sept-2025/20200101-DSC00222_01.jpg',
				alt: 'Festival energy',
			},
			{
				id: 'img-22',
				src: '/ducky-sept-2025/20200101-DSC00258_01.jpg',
				alt: 'Crowd shots',
			},
			{
				id: 'img-23',
				src: '/ducky-sept-2025/20200101-DSC00263_01.jpg',
				alt: 'Festival vibes',
			},
			{
				id: 'img-24',
				src: '/ducky-sept-2025/20200101-DSC00280_01.jpg',
				alt: 'Live music',
			},
			{
				id: 'img-25',
				src: '/ducky-sept-2025/20200101-DSC00282_01.jpg',
				alt: 'Festival atmosphere',
			},
			{
				id: 'img-26',
				src: '/ducky-sept-2025/20200101-DSC00297_01.jpg',
				alt: 'Crowd enjoying the show',
			},
			{
				id: 'img-27',
				src: '/ducky-sept-2025/20200101-DSC00304_01.jpg',
				alt: 'Festival moments',
			},
			{
				id: 'img-28',
				src: '/ducky-sept-2025/20200101-DSC00308_01.jpg',
				alt: 'Stage performance',
			},
			{
				id: 'img-29',
				src: '/ducky-sept-2025/20200101-DSC00318_01.jpg',
				alt: 'Festival crowd',
			},
			{
				id: 'img-30',
				src: '/ducky-sept-2025/20200101-DSC00339_01.jpg',
				alt: 'Live performance',
			},
			{
				id: 'img-31',
				src: '/ducky-sept-2025/20200101-DSC00343_01.jpg',
				alt: 'Festival energy',
			},
			{
				id: 'img-32',
				src: '/ducky-sept-2025/20200101-DSC00375_01.jpg',
				alt: 'Crowd dancing',
			},
			{
				id: 'img-33',
				src: '/ducky-sept-2025/20200101-DSC00380_01.jpg',
				alt: 'Festival atmosphere',
			},
			{
				id: 'img-34',
				src: '/ducky-sept-2025/20200101-DSC00384_01.jpg',
				alt: 'Stage lights',
			},
			{
				id: 'img-35',
				src: '/ducky-sept-2025/20200101-DSC00421_01.jpg',
				alt: 'Festival vibes',
			},
			{
				id: 'img-36',
				src: '/ducky-sept-2025/20200101-DSC00429_01.jpg',
				alt: 'Crowd shots',
			},
			{
				id: 'img-37',
				src: '/ducky-sept-2025/20200101-DSC00433_01.jpg',
				alt: 'Live music performance',
			},
			{
				id: 'img-38',
				src: '/ducky-sept-2025/20200101-DSC00444_01.jpg',
				alt: 'Festival crowd',
			},
			{
				id: 'img-39',
				src: '/ducky-sept-2025/20200101-DSC00459_01.jpg',
				alt: 'Dancing at ducky.endless summer',
			},
			{
				id: 'img-40',
				src: '/ducky-sept-2025/20200101-DSC00463_01.jpg',
				alt: 'Festival moments',
			},
			{
				id: 'img-41',
				src: '/ducky-sept-2025/20200101-DSC00471_01.jpg',
				alt: 'Stage performance',
			},
			{
				id: 'img-42',
				src: '/ducky-sept-2025/20200101-DSC00499_01.jpg',
				alt: 'Festival atmosphere',
			},
			{
				id: 'img-43',
				src: '/ducky-sept-2025/20200101-DSC00500_01.jpg',
				alt: 'Crowd enjoying music',
			},
			{
				id: 'img-44',
				src: '/ducky-sept-2025/20200101-DSC00503_01.jpg',
				alt: 'Festival energy',
			},
			{
				id: 'img-45',
				src: '/ducky-sept-2025/20200101-DSC00510_01.jpg',
				alt: 'ducky.endless summer finale',
			},
		],
	},
}

/**
 * Get gallery by ID
 */
export function getGallery(id: string): EventGallery | undefined {
	return galleries[id]
}

/**
 * Get all gallery IDs
 */
export function getAllGalleryIds(): string[] {
	return Object.keys(galleries)
}

/**
 * Get all galleries
 */
export function getAllGalleries(): EventGallery[] {
	return Object.values(galleries)
}
