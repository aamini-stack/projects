import type { Hero, HeroDictionary, HeroName } from '@/lib/dota/hero'
import { type Attribute, HeroStatsAnalyzer } from '@/lib/dota/hero-percentiles'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@aamini/ui/components/select'
import { useMemo, useState } from 'react'

const displayNames: Record<Attribute, string> = {
	baseMagicResistance: 'Base Magic Res',
	baseHealthRegen: 'Base HP Regen',
	baseHealth: 'Base HP',
	baseArmor: 'Base Armor',
	baseAttackMin: 'Base Attack Min',
	baseAttackMax: 'Base Attack Max',
	baseAttackTime: 'Base Attack Time',
	agiGain: 'Agility Gain',
	intGain: 'Intelligence Gain',
	strGain: 'Strength Gain',
	baseAgi: 'Base Agility',
	baseStr: 'Base Strength',
	baseInt: 'Base Intelligence',
	baseMana: 'Base Mana',
	baseManaRegen: 'Base Mana Regen',
	dayVision: 'Day Vision',
	nightVision: 'Night Vision',
	attackRange: 'Attack Range',
	projectileSpeed: 'Projectile Speed',
	attackRate: 'Attack Rate',
	attackPoint: 'Attack Point',
	moveSpeed: 'Move Speed',
}

const statGroups = {
	Attributes: [
		'baseStr',
		'strGain',
		'baseAgi',
		'agiGain',
		'baseInt',
		'intGain',
	],
	Vitals: ['baseHealth', 'baseHealthRegen', 'baseMana', 'baseManaRegen'],
	Defense: ['baseArmor', 'baseMagicResistance'],
	Vision: ['dayVision', 'nightVision'],
}

function StatCard({
	attribute,
	hero,
	heroStats,
	heroName,
	onClick,
	isSelected,
}: {
	attribute: Attribute
	hero: Hero
	heroStats: HeroStatsAnalyzer
	heroName: HeroName
	onClick: () => void
	isSelected: boolean
}) {
	const percentile = Math.round(
		Number(heroStats.computePercentile(heroName, attribute) * 100),
	)
	return (
		<div
			key={attribute}
			className={`w-full p-2 cursor-pointer rounded transition-colors ${
				isSelected ? 'bg-blue-100 border border-blue-400' : 'hover:bg-gray-100'
			}`}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					onClick()
				}
			}}
			role="button"
			tabIndex={0}
		>
			<div className="truncate overflow-hidden text-sm font-bold whitespace-nowrap">
				{displayNames[attribute]}: {hero[attribute]}
			</div>
			<div className="text-sm text-gray-500">
				<span style={{ color: getPercentileColor(percentile) }}>
					{percentile}th percentile
				</span>
			</div>
		</div>
	)
}

function StatGroup({
	title,
	attributes,
	hero,
	heroStats,
	heroName,
	onStatClick,
	selectedStat,
}: {
	title: string
	attributes: Attribute[]
	hero: Hero
	heroStats: HeroStatsAnalyzer
	heroName: HeroName
	onStatClick: (attr: Attribute) => void
	selectedStat: Attribute | null
}) {
	return (
		<div className="min-w-50 shrink-0 rounded border p-4">
			<h3 className="mb-3 text-xl font-semibold">{title}</h3>
			<div className="flex flex-col gap-1">
				{attributes.map((attr) => (
					<StatCard
						key={attr}
						attribute={attr}
						hero={hero}
						heroStats={heroStats}
						heroName={heroName}
						onClick={() => onStatClick(attr)}
						isSelected={selectedStat === attr}
					/>
				))}
			</div>
		</div>
	)
}

function PercentileVisualization({
	attribute,
	heroDictionary,
	heroStats,
	currentHeroName,
}: {
	attribute: Attribute
	heroDictionary: HeroDictionary
	heroStats: HeroStatsAnalyzer
	currentHeroName: HeroName
}) {
	// Get all hero values for this attribute and sort them
	const heroValues = useMemo(() => {
		const values = Array.from(heroDictionary.entries())
			.map(([heroName, hero]) => ({
				name: heroName,
				value: hero[attribute],
				percentile: Math.round(
					heroStats.computePercentile(heroName, attribute) * 100,
				),
				iconImage: hero.iconImage,
			}))
			.sort((a, b) => a.value - b.value)
		return values
	}, [heroDictionary, attribute, heroStats])

	const currentHeroValue = heroValues.find((h) => h.name === currentHeroName)

	// Create percentile buckets (0-10, 10-20, ..., 90-100)
	const buckets = Array.from({ length: 10 }, (_, i) => {
		const min = i * 10
		const max = (i + 1) * 10
		const heroesInBucket = heroValues.filter(
			(h) => h.percentile >= min && h.percentile < max,
		)
		return { min, max, count: heroesInBucket.length, heroes: heroesInBucket }
	})

	const maxCount = Math.max(...buckets.map((b) => b.count))

	return (
		<div className="mt-6 w-full rounded border p-4 bg-gray-50">
			<h3 className="mb-4 text-xl font-semibold">
				{displayNames[attribute]} Distribution
			</h3>
			<div className="mb-4 text-sm text-gray-600">
				Your hero ({currentHeroName}) has {currentHeroValue?.value}{' '}
				{displayNames[attribute]} (
				<span
					style={{
						color: getPercentileColor(currentHeroValue?.percentile ?? 0),
					}}
				>
					{currentHeroValue?.percentile}th percentile
				</span>
				)
			</div>

			{/* Bar Chart with Hero Icons */}
			<div className="flex items-end gap-1 h-64 mb-2 relative">
				{buckets.map((bucket, i) => {
					const heightPercent = (bucket.count / maxCount) * 100
					const isCurrentHeroBucket =
						currentHeroValue &&
						currentHeroValue.percentile >= bucket.min &&
						currentHeroValue.percentile < bucket.max

					return (
						<div key={i} className="flex-1 flex flex-col items-center relative">
							<div
								className={`w-full rounded-t transition-all ${
									isCurrentHeroBucket
										? 'bg-blue-500'
										: 'bg-gray-300 hover:bg-gray-400'
								}`}
								style={{ height: `${heightPercent}%` }}
								title={`${bucket.min}-${bucket.max}th percentile: ${bucket.count} heroes`}
							>
								{/* Show hero icons stacked in the bar */}
								<div className="flex flex-col-reverse items-center justify-end h-full gap-0.5 p-1 overflow-hidden">
									{bucket.heroes.slice(0, 10).map((hero) => (
										<img
											key={hero.name}
											src={hero.iconImage}
											alt={hero.name}
											title={`${hero.name} (${hero.value})`}
											className={`w-6 h-6 rounded-sm ${
												hero.name === currentHeroName
													? 'ring-2 ring-yellow-400'
													: ''
											}`}
										/>
									))}
									{bucket.heroes.length > 10 && (
										<div className="text-xs text-white font-bold">
											+{bucket.heroes.length - 10}
										</div>
									)}
								</div>
							</div>
						</div>
					)
				})}
			</div>

			{/* X-axis labels */}
			<div className="flex gap-1">
				{buckets.map((bucket, i) => (
					<div key={i} className="flex-1 text-center text-xs text-gray-600">
						{bucket.min}
					</div>
				))}
				<div className="text-xs text-gray-600">100</div>
			</div>
			<div className="mt-1 text-center text-xs text-gray-500">Percentile</div>

			{/* Stats summary */}
			<div className="mt-4 grid grid-cols-3 gap-4 text-sm">
				<div>
					<div className="font-semibold">Min</div>
					<div>{heroValues[0]?.value}</div>
				</div>
				<div>
					<div className="font-semibold">Median</div>
					<div>
						{heroValues[Math.floor(heroValues.length / 2)]?.value}
					</div>
				</div>
				<div>
					<div className="font-semibold">Max</div>
					<div>{heroValues[heroValues.length - 1]?.value}</div>
				</div>
			</div>
		</div>
	)
}

export function HeroStats({
	heroDictionary,
}: {
	heroDictionary: HeroDictionary
}) {
	const [name, setName] = useState<HeroName>('Anti-Mage')
	const [selectedStat, setSelectedStat] = useState<Attribute | null>('baseArmor')
	const heroStats = useMemo(
		() => new HeroStatsAnalyzer(heroDictionary),
		[heroDictionary],
	)

	const hero = heroDictionary.get(name)
	if (!hero) {
		throw new Error('Missing hero')
	}

	function HeroSelect({
		value,
		onChange,
	}: {
		value: HeroName
		onChange: (name: HeroName) => void
	}) {
		return (
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className="w-70">
					<SelectValue placeholder="Select a hero" />
				</SelectTrigger>
				<SelectContent>
					{Array.from(heroDictionary.keys(), (heroName) => (
						<SelectItem key={heroName} value={heroName}>
							{heroName}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		)
	}

	return (
		<div className="mb-8 w-full max-w-4xl">
			<div className="mb-4">
				<HeroSelect
					value={name}
					onChange={(newName) => {
						setName(newName)
					}}
				/>
			</div>
			<div>
				<h2 className="flex gap-2 text-2xl font-bold capitalize">
					{name} <img src={hero.iconImage} alt="" width={32} height={32} />
				</h2>
				<div className="mt-4 flex flex-nowrap gap-8 overflow-x-auto">
					{Object.entries(statGroups).map(([groupName, groupAttributes]) => (
						<StatGroup
							key={groupName}
							title={groupName}
							attributes={groupAttributes as Attribute[]}
							hero={hero}
							heroStats={heroStats}
							heroName={name}
							onStatClick={setSelectedStat}
							selectedStat={selectedStat}
						/>
					))}
				</div>
				{selectedStat && (
					<PercentileVisualization
						attribute={selectedStat}
						heroDictionary={heroDictionary}
						heroStats={heroStats}
						currentHeroName={name}
					/>
				)}
			</div>
		</div>
	)
}

function getPercentileColor(percentile: number): string {
	let r: number, g: number, b: number

	if (percentile <= 50) {
		// Interpolate from Red (255, 0, 0) to Orange-Yellow (255, 165, 0)
		// Red stays at 255, Green increases from 0 to 165
		r = 255
		g = Math.round((percentile / 50) * 165)
		b = 0
	} else {
		// Interpolate from Orange-Yellow (255, 165, 0) to Green (0, 255, 0)
		// Red decreases from 255 to 0, Green increases from 165 to 255
		r = Math.round(((100 - percentile) / 50) * 255)
		g = Math.round(165 + ((percentile - 50) / 50) * (255 - 165))
		b = 0
	}

	return `rgb(${String(r)}, ${String(g)}, ${String(b)})`
}
