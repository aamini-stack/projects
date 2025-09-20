import { type } from 'arktype'
import {
	type Hero,
	type HeroDictionary,
	type HeroName,
	heroNames,
} from '#/lib/dota/hero'

export async function fetchLatestHeroData(): Promise<HeroDictionary> {
	const response = await fetch('https://api.opendota.com/api/heroStats')
	const openApiData = await parseOpenDotaApiResponse(response)
	const entries: [HeroName, Hero][] = openApiData.map((hero) => [
		hero.localized_name,
		{
			name: hero.localized_name,
			attackType: hero.attack_type,
			attackRange: hero.attack_range,
			projectileSpeed: hero.projectile_speed,
			attackRate: hero.attack_rate,
			baseAttackMin: hero.base_attack_min,
			baseAttackMax: hero.base_attack_max,
			baseAttackTime: hero.base_attack_time,
			attackPoint: hero.attack_point,
			moveSpeed: hero.move_speed,
			primaryAttribute: hero.primary_attr,
			baseStr: hero.base_str,
			baseAgi: hero.base_agi,
			baseInt: hero.base_int,
			strGain: hero.str_gain,
			agiGain: hero.agi_gain,
			intGain: hero.int_gain,
			baseArmor: hero.base_armor,
			baseMagicResistance: hero.base_mr,
			baseHealth: hero.base_health ?? 0,
			baseHealthRegen: hero.base_health_regen ?? 0,
			baseMana: hero.base_mana,
			baseManaRegen: hero.base_mana_regen,
			dayVision: hero.day_vision,
			nightVision: hero.night_vision,
			iconImage: `https://cdn.steamstatic.com${hero.icon}`,
			roles: hero.roles,
			cmEnabled: hero.cm_enabled,
		},
	])
	return new Map(entries)
}

async function parseOpenDotaApiResponse(response: Response) {
	const OpenDotaHero = type({
		id: 'number',
		name: 'string',
		localized_name: type.enumerated(...heroNames),
		primary_attr: 'string',
		attack_type: 'string',
		roles: 'string[]',
		img: 'string',
		icon: 'string',
		base_health: 'number | null',
		base_health_regen: 'number | null',
		base_mana: 'number',
		base_mana_regen: 'number',
		base_armor: 'number',
		base_mr: 'number',
		base_attack_min: 'number',
		base_attack_max: 'number',
		base_str: 'number',
		base_agi: 'number',
		base_int: 'number',
		str_gain: 'number',
		agi_gain: 'number',
		int_gain: 'number',
		attack_range: 'number',
		projectile_speed: 'number',
		attack_rate: 'number',
		base_attack_time: 'number',
		attack_point: 'number',
		move_speed: 'number',
		cm_enabled: 'boolean',
		legs: 'number',
		day_vision: 'number',
		night_vision: 'number',
		'1_pick': 'number',
		'1_win': 'number',
		'2_pick': 'number',
		'2_win': 'number',
		'3_pick': 'number',
		'3_win': 'number',
		'4_pick': 'number',
		'4_win': 'number',
		'5_pick': 'number',
		'5_win': 'number',
		'6_pick': 'number',
		'6_win': 'number',
		'7_pick': 'number',
		'7_win': 'number',
		'8_pick': 'number',
		'8_win': 'number',
		turbo_picks: 'number',
		turbo_picks_trend: 'number[]',
		turbo_wins: 'number',
		turbo_wins_trend: 'number[]',
		pro_pick: 'number',
		pro_win: 'number',
		pro_ban: 'number',
		pub_pick: 'number',
		pub_pick_trend: 'number[]',
		pub_win: 'number',
		pub_win_trend: 'number[]',
	})

	const out = OpenDotaHero.array()(await response.json())
	if (out instanceof type.errors) {
		throw new Error(out.summary)
	}
	return out
}
