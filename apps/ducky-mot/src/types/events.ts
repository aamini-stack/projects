/**
 * Event type definitions for Ducky Mot events
 *
 * Supports incremental migration from legacy WordPress galleries to modern
 * in-app galleries through discriminated unions.
 */

/** Legacy event that links to external WordPress gallery */
export type LegacyEventItem = {
	kind: 'legacy'
	date: string
	title: string
	legacyHref: string
	img: string
}

/** Modern event that links to internal gallery page */
export type ModernEventItem = {
	kind: 'modern'
	date: string
	title: string
	href: string // Internal route like "/events/ducky-fest-2025-05-17"
	img: string
	galleryId: string // Reference to gallery data
}

/**
 * Discriminated union of event types Use the 'kind' property to determine which
 * type of event
 */
export type EventItem = LegacyEventItem | ModernEventItem

/** Year group containing multiple events */
export type YearGroup = {
	year: number
	items: EventItem[]
}

/** Type guard to check if event is legacy */
export function isLegacyEvent(event: EventItem): event is LegacyEventItem {
	return event.kind === 'legacy'
}

/** Type guard to check if event is modern */
export function isModernEvent(event: EventItem): event is ModernEventItem {
	return event.kind === 'modern'
}
