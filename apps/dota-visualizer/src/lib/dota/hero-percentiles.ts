import type { Hero, HeroDictionary, HeroName } from '@/lib/dota/hero'

export type Attribute = {
	[K in keyof Hero]: Hero[K] extends number ? K : never
}[keyof Hero]

export const attributes: Attribute[] = [
	'baseStr',
	'baseAgi',
	'baseInt',
	'strGain',
	'agiGain',
	'intGain',
	'baseArmor',
	'baseMagicResistance',
	'baseHealth',
	'baseHealthRegen',
	'baseMana',
	'baseManaRegen',
	'dayVision',
	'nightVision',
] as const

type StatsTable = Map<
	Attribute,
	{
		mean: number
		sigma: number
	}
>

export class HeroStatsAnalyzer {
	private readonly allHeroes: HeroDictionary
	private readonly stats: StatsTable

	constructor(allHeroes: HeroDictionary) {
		this.allHeroes = allHeroes
		this.stats = HeroStatsAnalyzer.createAttributesStatsTable(this.allHeroes)
	}

	public computePercentile(heroName: HeroName, attr: Attribute): number {
		const value = this.allHeroes.get(heroName)?.[attr] ?? 0
		const { mean, sigma } = this.stats.get(attr) ?? { mean: 0, sigma: 0 }
		if (sigma !== 0) {
			const stddev = (value - mean) / sigma
			return percentile(stddev)
		} else {
			return 0.5
		}
	}

	private static createAttributesStatsTable(
		allHeroes: HeroDictionary,
	): StatsTable {
		const stats: StatsTable = new Map()
		for (const attr of attributes) {
			const allValuesForAttribute = Array.from(allHeroes.values()).map(
				(hero) => hero[attr],
			)
			stats.set(attr, calculateStats(allValuesForAttribute))
		}
		return stats
	}
}

// #############################################################################
// # MATH
// #############################################################################
export function calculateStats(population: number[]): {
	mean: number
	sigma: number
} {
	const sum = (arr: number[]) => arr.reduce((x, y) => x + y)
	const n = population.length
	const mean = sum(population) / n
	const variance = sum(population.map((x) => (x - mean) ** 2)) / n
	const sigma = Math.sqrt(variance)
	return {
		mean,
		sigma,
	}
}

// https://stackoverflow.com/a/16197404/6310030
export function percentile(z: number): number {
	// If z is greater than 6.5, the number of significant digits will
	// be outside of a reasonable range.
	if (z < -6.5) return 0.0
	if (z > 6.5) return 1.0

	let factK = 1
	let sum = 0
	let term = 1
	let k = 0
	const loopStop = Math.exp(-23)
	while (Math.abs(term) > loopStop) {
		term =
			(((0.3989422804 * (-1) ** k * z ** k) / (2 * k + 1) / 2 ** k) *
				z ** (k + 1)) /
			factK
		sum += term
		k++
		factK *= k
	}
	sum += 0.5
	sum = Math.round((sum + Number.EPSILON) * 1000) / 1000 // Round 3 places.
	return sum + 0 // num + 0 to prevent -0 case. # https://stackoverflow.com/a/77037516/6310030
}
