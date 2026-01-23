import ArmorTableView from './armor-table'
import HeroStatsView from './hero-stats'
import type { ViewDefinition } from './types'
import XpGoldView from './xp-gold'

export const views: ViewDefinition[] = [
	{
		id: 'hero-stats',
		name: 'Hero Stats',
		description: 'View individual hero stats with percentile rankings',
		component: HeroStatsView,
	},
	{
		id: 'armor-table',
		name: 'Armor Table',
		description: 'Heroes grouped by base armor value',
		component: ArmorTableView,
	},
	{
		id: 'xp-gold',
		name: 'XP & Gold',
		description: 'Learn about XP levels, creep scaling, and neutral gold',
		component: XpGoldView,
	},
]

export const viewsById = new Map(views.map((v) => [v.id, v]))

export const defaultViewId = 'hero-stats'

export function getView(id: string): ViewDefinition {
	return viewsById.get(id) ?? viewsById.get(defaultViewId)!
}
