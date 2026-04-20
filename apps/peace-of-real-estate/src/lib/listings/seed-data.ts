import type { ListingDetails, ListingSummary } from './types'

export const listings: ListingSummary[] = [
	{
		id: 'sunset-loft-linden',
		slug: 'sunset-loft-linden',
		title: 'Sunset Loft on Linden',
		city: 'Austin',
		state: 'TX',
		propertyType: 'Loft',
		bedrooms: 1,
		bathrooms: 1,
		squareFeet: 820,
		listPrice: 385000,
		status: 'Hot home',
		vibeSummary:
			'Brick walls, rooftop string lights, and enough natural light to start a ceramics phase.',
		heroImageUrl: null,
		swipeScore: 98,
	},
	{
		id: 'soft-launch-townhouse',
		slug: 'soft-launch-townhouse',
		title: 'Soft-Launch Townhouse',
		city: 'Brooklyn',
		state: 'NY',
		propertyType: 'Townhouse',
		bedrooms: 2,
		bathrooms: 2,
		squareFeet: 1380,
		listPrice: 1095000,
		status: 'Just listed',
		vibeSummary:
			'Two sunny floors, one tiny balcony, and elite dinner-party delusion.',
		heroImageUrl: null,
		swipeScore: 92,
	},
	{
		id: 'ghost-mode-cabin',
		slug: 'ghost-mode-cabin',
		title: 'Ghost Mode Cabin',
		city: 'Portland',
		state: 'OR',
		propertyType: 'Cabin',
		bedrooms: 2,
		bathrooms: 1,
		squareFeet: 960,
		listPrice: 445000,
		status: 'Price drop',
		vibeSummary:
			'A-frame calm, cedar smell, and weak cell service for stronger boundaries.',
		heroImageUrl: null,
		swipeScore: 89,
	},
	{
		id: 'poolside-chaos-villa',
		slug: 'poolside-chaos-villa',
		title: 'Poolside Chaos Villa',
		city: 'Palm Springs',
		state: 'CA',
		propertyType: 'Villa',
		bedrooms: 3,
		bathrooms: 2,
		squareFeet: 1840,
		listPrice: 890000,
		status: 'Trending',
		vibeSummary:
			'Travertine floors, dramatic palms, and playlist-based confidence.',
		heroImageUrl: null,
		swipeScore: 94,
	},
	{
		id: 'cozy-chaos-bungalow',
		slug: 'cozy-chaos-bungalow',
		title: 'Cozy Chaos Bungalow',
		city: 'Nashville',
		state: 'TN',
		propertyType: 'Bungalow',
		bedrooms: 2,
		bathrooms: 2,
		squareFeet: 1180,
		listPrice: 525000,
		status: 'Touring fast',
		vibeSummary:
			'Front porch charm, moody dining nook, and enough room for questionable hobbies.',
		heroImageUrl: null,
		swipeScore: 87,
	},
]

const priceHistoryByListing: Record<string, ListingDetails['priceHistory']> = {
	'sunset-loft-linden': [
		{
			id: 'sunset-1',
			recordedAt: '2025-01-12',
			price: 420000,
			eventType: 'listed',
			title: 'Listed above market to feel something',
		},
		{
			id: 'sunset-2',
			recordedAt: '2025-02-02',
			price: 405000,
			eventType: 'price drop',
			title: 'Reality entered chat',
		},
		{
			id: 'sunset-3',
			recordedAt: '2025-02-21',
			price: 398000,
			eventType: 'price drop',
			title: 'More flirty pricing',
		},
		{
			id: 'sunset-4',
			recordedAt: '2025-03-15',
			price: 385000,
			eventType: 'active',
			title: 'Current asking price',
		},
	],
	'soft-launch-townhouse': [
		{
			id: 'soft-1',
			recordedAt: '2025-01-05',
			price: 1135000,
			eventType: 'listed',
			title: 'Debut with dramatic confidence',
		},
		{
			id: 'soft-2',
			recordedAt: '2025-01-28',
			price: 1110000,
			eventType: 'price drop',
			title: 'A tiny compromise',
		},
		{
			id: 'soft-3',
			recordedAt: '2025-03-10',
			price: 1095000,
			eventType: 'active',
			title: 'Now accepting emotionally prepared buyers',
		},
	],
	'ghost-mode-cabin': [
		{
			id: 'ghost-1',
			recordedAt: '2024-12-18',
			price: 480000,
			eventType: 'listed',
			title: 'Listed during escapist season',
		},
		{
			id: 'ghost-2',
			recordedAt: '2025-01-30',
			price: 460000,
			eventType: 'price drop',
			title: 'Softer ask, same forest drama',
		},
		{
			id: 'ghost-3',
			recordedAt: '2025-03-01',
			price: 445000,
			eventType: 'active',
			title: 'Current ask',
		},
	],
	'poolside-chaos-villa': [
		{
			id: 'pool-1',
			recordedAt: '2025-01-08',
			price: 910000,
			eventType: 'listed',
			title: 'Listed for the hot people',
		},
		{
			id: 'pool-2',
			recordedAt: '2025-02-11',
			price: 890000,
			eventType: 'active',
			title: 'Current ask',
		},
	],
	'cozy-chaos-bungalow': [
		{
			id: 'cozy-1',
			recordedAt: '2025-02-06',
			price: 540000,
			eventType: 'listed',
			title: 'Launched with porch energy',
		},
		{
			id: 'cozy-2',
			recordedAt: '2025-02-27',
			price: 525000,
			eventType: 'active',
			title: 'Current ask',
		},
	],
}

export function getSeedListingDetails(
	listingId: string,
): ListingDetails | undefined {
	const summary = listings.find((listing) => listing.id === listingId)
	if (!summary) {
		return undefined
	}

	return {
		summary,
		priceHistory: priceHistoryByListing[listingId] ?? [],
	}
}

export const featuredListing = getSeedListingDetails('sunset-loft-linden')
