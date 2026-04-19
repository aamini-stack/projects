import { listing } from '@/db/tables'
import { desc, ilike, or } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

export async function fetchSuggestions(db: NodePgDatabase, q: string) {
	const normalizedQuery = q.trim()
	if (!normalizedQuery) {
		throw new Error('Empty search parameter (q)')
	}

	const pattern = `%${normalizedQuery}%`

	return await db
		.select()
		.from(listing)
		.where(
			or(
				ilike(listing.title, pattern),
				ilike(listing.city, pattern),
				ilike(listing.state, pattern),
				ilike(listing.propertyType, pattern),
			),
		)
		.orderBy(desc(listing.swipeScore), desc(listing.listPrice))
		.limit(5)
}
