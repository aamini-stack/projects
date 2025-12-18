/**
 * Gallery data for Ducky Mot events
 *
 * This file contains the image galleries for events that have been migrated
 * from the legacy WordPress system to the modern in-app gallery.
 */

import fs from 'node:fs'
import path from 'node:path'

export type GalleryImage = {
	id: string
	src: string
	alt: string
	thumbnail?: string // Optional optimized thumbnail URL
}

/** Dynamically load images from a public directory */
function loadImagesFromDirectory(dirPath: string): GalleryImage[] {
	const publicDir = path.join(process.cwd(), 'public', dirPath)

	if (!fs.existsSync(publicDir)) {
		console.warn(`Directory not found: ${publicDir}`)
		return []
	}

	const files = fs.readdirSync(publicDir)
	const imageFiles = files
		.filter(
			(file) =>
				file.endsWith('.jpg') ||
				file.endsWith('.jpeg') ||
				file.endsWith('.png') ||
				file.endsWith('.webp'),
		)
		.sort()

	return imageFiles.map((file, index) => ({
		id: `img-${index + 1}`,
		src: `/${dirPath}/${file}`,
		alt: '',
	}))
}

export type EventGallery = {
	id: string
	slug: string // URL slug for the event (e.g., "ducky-fest-2025-05-17")
	eventTitle: string
	eventDate: string
	coverImage: string // Main event image
	images: GalleryImage[]
}

/** Gallery metadata without images (images are loaded on-demand) */
const galleryMetadata: Record<
	string,
	Omit<EventGallery, 'images'> & { imageDir: string }
> = {
	'ducky-endless-summer-2025-09-19': {
		id: 'ducky-endless-summer-2025-09-19',
		slug: 'ducky-endless-summer-2025-09-19',
		eventTitle: 'ducky.endless summer',
		eventDate: '19th September 2025',
		coverImage: '/ducky-sept-2025/20200101-DSC00025_01.jpg',
		imageDir: 'ducky-sept-2025',
	},
}

/** Get gallery by ID with images loaded dynamically */
export function getGallery(id: string): EventGallery | undefined {
	const metadata = galleryMetadata[id]
	if (!metadata) return undefined

	const { imageDir, ...rest } = metadata
	return {
		...rest,
		images: loadImagesFromDirectory(imageDir),
	}
}

/** Get all gallery IDs */
export function getAllGalleryIds(): string[] {
	return Object.keys(galleryMetadata)
}
