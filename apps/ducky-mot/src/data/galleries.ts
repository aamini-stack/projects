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
	'ducky-test-2025-03-15': {
		id: 'ducky-test-2025-03-15',
		slug: 'ducky-test-2025-03-15',
		eventTitle: 'ducky.test',
		eventDate: '15th March 2025',
		coverImage:
			'https://duckymot.com/wp-content/uploads/2025/09/DSC00243-1024x684.jpg',
		images: [
			{
				id: 'img-1',
				src: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1200',
				alt: 'Festival crowd enjoying music',
			},
			{
				id: 'img-2',
				src: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1200',
				alt: 'Live performance on stage',
			},
			{
				id: 'img-3',
				src: 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=1200',
				alt: 'Festival lights and atmosphere',
			},
			{
				id: 'img-4',
				src: 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=1200',
				alt: 'Musicians performing',
			},
			{
				id: 'img-5',
				src: 'https://images.pexels.com/photos/1769547/pexels-photo-1769547.jpeg?auto=compress&cs=tinysrgb&w=1200',
				alt: 'Festival crowd at night',
			},
			{
				id: 'img-6',
				src: 'https://images.pexels.com/photos/2747448/pexels-photo-2747448.jpeg?auto=compress&cs=tinysrgb&w=1200',
				alt: 'Stage lighting effects',
			},
			{
				id: 'img-7',
				src: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1200',
				alt: 'Festival attendees enjoying music',
			},
			{
				id: 'img-8',
				src: 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=1200',
				alt: 'DJ performing at festival',
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
