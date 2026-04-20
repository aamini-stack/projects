import { createDb } from '@/db/connection'
import { listing, pricePoint } from '@/db/tables'
import type { ListingDetails } from '@/lib/listings/types'
import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

export const getListingDetails = createServerFn()
	.inputValidator((data: { listingId: string }) => data)
	.handler(async ({ data }) => {
		const db = await createDb()
		return getListingDetailsDb(db, data.listingId)
	})

export async function getListingDetailsDb(
	db: NodePgDatabase,
	listingId: string,
): Promise<ListingDetails | undefined> {
	const result = await db
		.select()
		.from(listing)
		.where(eq(listing.id, listingId))
	const summary = result[0]
	if (!summary) {
		return undefined
	}

	const history = await db
		.select({
			id: pricePoint.id,
			recordedAt: pricePoint.recordedAt,
			price: pricePoint.price,
			eventType: pricePoint.eventType,
			title: pricePoint.title,
		})
		.from(pricePoint)
		.where(eq(pricePoint.listingId, listingId))
		.orderBy(asc(pricePoint.recordedAt))

	return {
		summary,
		priceHistory: history.map((point) => ({
			...point,
			recordedAt: point.recordedAt.toISOString().slice(0, 10),
		})),
	}
}
