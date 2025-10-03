import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const events = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './content/events' }),
	schema: z.object({
		year: z.number(),
		date: z.string(),
		title: z.string(),
		href: z.string().url(),
		img: z.string().url(),
		photos_zip: z.string().optional(),
	}),
})

export const collections = { events }
