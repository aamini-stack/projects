import { listing } from '@/db/tables'
import { listings } from '@/lib/listings/seed-data'
import { fetchSuggestions } from '@/lib/listings/search'
import { initDb, test } from '@aamini/config-testing/test/db'
import { describe, expect } from 'vitest'

initDb(async (db) => {
	await db.insert(listing).values(listings)
})

describe('listing search tests', () => {
	test('city search', async ({ db }) => {
		const results = await fetchSuggestions(db, 'Austin')
		expect(results[0]?.title).toBe('Sunset Loft on Linden')
	})

	test('property type search', async ({ db }) => {
		const results = await fetchSuggestions(db, 'Townhouse')
		expect(results[0]?.id).toBe('soft-launch-townhouse')
	})

	test('non-existent results', async ({ db }) => {
		const results = await fetchSuggestions(db, 'Moon bunker')
		expect(results).toHaveLength(0)
	})

	test('ranking prefers higher swipe score', async ({ db }) => {
		const results = await fetchSuggestions(db, 'o')
		expect(results[0]?.id).toBe('sunset-loft-linden')
	})
})
