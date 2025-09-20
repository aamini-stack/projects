import { describe, expect, test } from 'vitest'
import { fetchLatestHeroData } from '#/lib/dota/api'
import {
	calculateStats,
	HeroStatsAnalyzer,
	percentile,
} from '#/lib/dota/hero-percentiles'

describe('percentile', () => {
	test('0 stddev', () => {
		expect(percentile(0)).toEqual(0.5)
	})

	test('1 stddev', () => {
		expect(percentile(1)).toEqual(0.841)
	})

	test('2 stddev', () => {
		expect(percentile(2)).toEqual(0.977)
	})

	test('3 stddev', () => {
		expect(percentile(3)).toEqual(0.999)
	})
})

describe('stats', () => {
	test('basic case', () => {
		expect(calculateStats([100, 120, 110, 130, 140])).toEqual({
			mean: 120,
			sigma: 14.142135623730951,
		})
	})

	test('all same values', () => {
		expect(calculateStats([115, 115, 115, 115, 115, 115])).toEqual({
			mean: 115,
			sigma: 0,
		})
	})

	test('with duplicates', () => {
		expect(calculateStats([100, 120, 120, 120, 130])).toEqual({
			mean: 118,
			sigma: 9.797958971132712,
		})
	})
})

describe('HeroStatsAnalyzer', async () => {
	test('baseArmor for Anti-Mage', async () => {
		const stats = new HeroStatsAnalyzer(await fetchLatestHeroData())
		expect(stats.computePercentile('Anti-Mage', 'baseArmor')).toEqual(0.64)
	})

	test('baseInt for Zeus', async () => {
		const stats = new HeroStatsAnalyzer(await fetchLatestHeroData())
		expect(stats.computePercentile('Zeus', 'baseInt')).toEqual(0.687)
	})

	test('baseHealth for Alchemist', async () => {
		const stats = new HeroStatsAnalyzer(await fetchLatestHeroData())
		expect(stats.computePercentile('Alchemist', 'baseHealth')).toEqual(0.5)
	})

	test('baseStr for Medusa', async () => {
		const stats = new HeroStatsAnalyzer(await fetchLatestHeroData())
		expect(stats.computePercentile('Medusa', 'baseStr')).toEqual(0)
	})
})
