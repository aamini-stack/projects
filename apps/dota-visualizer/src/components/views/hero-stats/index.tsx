import type { Hero, HeroName } from '@/lib/dota/hero'
import { type Attribute, HeroStatsAnalyzer } from '@/lib/dota/hero-percentiles'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@aamini/ui/components/select'
import { useMemo, useState } from 'react'
import type { ViewProps } from '../types'

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
}: {
	attribute: Attribute
	hero: Hero
	heroStats: HeroStatsAnalyzer
	heroName: HeroName
}) {
	const percentile = Math.round(
		Number(heroStats.computePercentile(heroName, attribute) * 100),
	)
	return (
		<div key={attribute} className="w-full p-2">
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
}: {
	title: string
	attributes: Attribute[]
	hero: Hero
	heroStats: HeroStatsAnalyzer
	heroName: HeroName
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
					/>
				))}
			</div>
		</div>
	)
}

export default function HeroStatsView({ heroDictionary }: ViewProps) {
	const [name, setName] = useState<HeroName>('Anti-Mage')
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
						/>
					))}
				</div>
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
