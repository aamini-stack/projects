export interface ListingSummary {
	id: string
	slug: string
	title: string
	city: string
	state: string
	propertyType: string
	bedrooms: number
	bathrooms: number
	squareFeet: number
	listPrice: number
	status: string
	vibeSummary: string
	heroImageUrl: string | null
	swipeScore: number
}

export interface ListingPricePoint {
	id: string
	recordedAt: string
	price: number
	eventType: string
	title: string
}

export interface ListingDetails {
	summary: ListingSummary
	priceHistory: ListingPricePoint[]
}

export function formatLocation(listing: Pick<ListingSummary, 'city' | 'state'>) {
	return `${listing.city}, ${listing.state}`
}

export function formatPrice(price: number) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(price)
}

export function formatListingMeta(
	listing: Pick<
		ListingSummary,
		'propertyType' | 'bedrooms' | 'bathrooms' | 'squareFeet'
	>,
) {
	return `${listing.propertyType} · ${listing.bedrooms} bd · ${listing.bathrooms} ba · ${listing.squareFeet.toLocaleString()} sq ft`
}
