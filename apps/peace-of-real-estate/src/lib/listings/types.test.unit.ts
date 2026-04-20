import { describe, expect, test } from 'vitest'
import { formatListingMeta, formatLocation, formatPrice } from './types'

describe('listing formatters', () => {
	test('formats price', () => {
		expect(formatPrice(385000)).toBe('$385,000')
	})

	test('formats location', () => {
		expect(formatLocation({ city: 'Austin', state: 'TX' })).toBe('Austin, TX')
	})

	test('formats listing meta', () => {
		expect(
			formatListingMeta({
				propertyType: 'Loft',
				bedrooms: 1,
				bathrooms: 1,
				squareFeet: 820,
			}),
		).toBe('Loft · 1 bd · 1 ba · 820 sq ft')
	})
})
