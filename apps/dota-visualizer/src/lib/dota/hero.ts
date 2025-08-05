export type HeroDictionary = Map<HeroName, Hero>

export interface Hero {
	// Meta
	name: HeroName
	iconImage: string
	roles: string[]
	cmEnabled: boolean

	// Stats
	attackType: string
	primaryAttribute: string

	attackRange: number
	projectileSpeed: number
	attackRate: number
	baseAttackMin: number
	baseAttackMax: number
	baseAttackTime: number
	attackPoint: number

	moveSpeed: number

	// Attributes
	baseStr: number
	baseAgi: number
	baseInt: number
	strGain: number
	agiGain: number
	intGain: number

	// Resources
	baseArmor: number
	baseMagicResistance: number
	baseHealth: number
	baseHealthRegen: number
	baseMana: number
	baseManaRegen: number

	// Vision
	dayVision: number
	nightVision: number
}

export type HeroName = (typeof heroNames)[number]

export const heroNames = [
	'Anti-Mage',
	'Axe',
	'Bane',
	'Bloodseeker',
	'Crystal Maiden',
	'Drow Ranger',
	'Earthshaker',
	'Juggernaut',
	'Mirana',
	'Morphling',
	'Shadow Fiend',
	'Phantom Lancer',
	'Puck',
	'Pudge',
	'Razor',
	'Sand King',
	'Storm Spirit',
	'Sven',
	'Tiny',
	'Vengeful Spirit',
	'Windranger',
	'Zeus',
	'Kunkka',
	'Lina',
	'Lion',
	'Shadow Shaman',
	'Slardar',
	'Tidehunter',
	'Witch Doctor',
	'Lich',
	'Riki',
	'Enigma',
	'Tinker',
	'Sniper',
	'Necrophos',
	'Warlock',
	'Beastmaster',
	'Queen of Pain',
	'Venomancer',
	'Faceless Void',
	'Wraith King',
	'Death Prophet',
	'Phantom Assassin',
	'Pugna',
	'Templar Assassin',
	'Viper',
	'Luna',
	'Dragon Knight',
	'Dazzle',
	'Clockwerk',
	'Leshrac',
	"Nature's Prophet",
	'Lifestealer',
	'Dark Seer',
	'Clinkz',
	'Omniknight',
	'Enchantress',
	'Huskar',
	'Night Stalker',
	'Broodmother',
	'Bounty Hunter',
	'Weaver',
	'Jakiro',
	'Batrider',
	'Chen',
	'Spectre',
	'Ancient Apparition',
	'Doom',
	'Ursa',
	'Spirit Breaker',
	'Gyrocopter',
	'Alchemist',
	'Invoker',
	'Silencer',
	'Outworld Devourer',
	'Lycan',
	'Brewmaster',
	'Shadow Demon',
	'Lone Druid',
	'Chaos Knight',
	'Meepo',
	'Treant Protector',
	'Ogre Magi',
	'Undying',
	'Rubick',
	'Disruptor',
	'Nyx Assassin',
	'Naga Siren',
	'Keeper of the Light',
	'Io',
	'Visage',
	'Slark',
	'Medusa',
	'Troll Warlord',
	'Centaur Warrunner',
	'Magnus',
	'Timbersaw',
	'Bristleback',
	'Tusk',
	'Skywrath Mage',
	'Abaddon',
	'Elder Titan',
	'Legion Commander',
	'Techies',
	'Ember Spirit',
	'Earth Spirit',
	'Underlord',
	'Terrorblade',
	'Phoenix',
	'Oracle',
	'Winter Wyvern',
	'Arc Warden',
	'Monkey King',
	'Dark Willow',
	'Pangolier',
	'Grimstroke',
	'Hoodwink',
	'Void Spirit',
	'Snapfire',
	'Mars',
	'Ring Master',
	'Dawnbreaker',
	'Marci',
	'Primal Beast',
	'Muerta',
	'Kez',
] as const
