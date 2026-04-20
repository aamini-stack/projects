import { listing, pricePoint } from '@/db/tables'
import { listings, getSeedListingDetails } from '@/lib/listings/seed-data'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

export async function seedDatabase(db: NodePgDatabase) {
	await db.delete(pricePoint)
	await db.delete(listing)

	await db.insert(listing).values(listings)

	const allPricePoints = listings.flatMap((summary) => {
		const details = getSeedListingDetails(summary.id)
		return (
			details?.priceHistory.map((point) => ({
				...point,
				listingId: summary.id,
				recordedAt: new Date(`${point.recordedAt}T12:00:00`),
			})) ?? []
		)
	})

	await db.insert(pricePoint).values(allPricePoints)
}
