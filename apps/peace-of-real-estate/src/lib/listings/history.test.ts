import { listing, pricePoint } from '@/db/tables'
import { getListingDetailsDb } from '@/lib/listings/history'
import { getSeedListingDetails, listings } from '@/lib/listings/seed-data'
import { initDb, test } from '@aamini/config-testing/test/db'
import { describe, expect } from 'vitest'

initDb(async (db) => {
	await db.insert(listing).values(listings)
	const featuredListing = getSeedListingDetails('sunset-loft-linden')
	if (!featuredListing) {
		throw new Error('Missing listing fixture')
	}

	await db.insert(pricePoint).values(
		featuredListing.priceHistory.map((point) => ({
			...point,
			listingId: featuredListing.summary.id,
			recordedAt: new Date(`${point.recordedAt}T12:00:00`),
		})),
	)
})

describe('listing details tests', () => {
	test('loads listing history', async ({ db }) => {
		const result = await getListingDetailsDb(db, 'sunset-loft-linden')
		expect(result?.summary.title).toBe('Sunset Loft on Linden')
		expect(result?.priceHistory).toHaveLength(4)
		expect(result?.priceHistory[0]?.eventType).toBe('listed')
	})

	test('returns undefined for missing listing', async ({ db }) => {
		const result = await getListingDetailsDb(db, 'missing')
		expect(result).toBeUndefined()
	})
})
