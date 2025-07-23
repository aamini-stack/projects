import { type } from 'arktype';

export interface Hero {
  primaryAttribute: string;
  attackType: string;
  roles: string[];
  iconImage: string;
  baseHealth: number | null;
  baseHealthRegen: number | null;
  baseMana: number;
  baseManaRegen: number;
  baseArmor: number;
  baseMagicResistance: number;
  baseAttackMin: number;
  baseAttackMax: number;
  baseStr: number;
  baseAgi: number;
  baseInt: number;
  strGain: number;
  agiGain: number;
  intGain: number;
  attackRange: number;
  projectileSpeed: number;
  attackRate: number;
  baseAttackTime: number;
  attackPoint: number;
  moveSpeed: number;
  cmEnabled: boolean;
  dayVision: number;
  nightVision: number;
}

export type HeroDictionary = Record<string, Hero>;

export async function fetchLatestHeroData(): Promise<HeroDictionary> {
  const resp = await fetch('https://api.opendota.com/api/heroStats');
  const OpenApiHeroSpec = type({
    id: 'number',
    name: 'string',
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
    localized_name: 'string',
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
  });

  type OpenApiHeroSpec = typeof OpenApiHeroSpec.infer;

  const out = OpenApiHeroSpec.array()(await resp.json());
  if (out instanceof type.errors) {
    throw new Error(out.summary);
  }

  const dictionary: HeroDictionary = {};
  for (const x of out) {
    dictionary[x.localized_name] = {
      primaryAttribute: x.primary_attr,
      attackType: x.attack_type,
      roles: x.roles,
      iconImage: 'https://cdn.steamstatic.com' + x.icon,
      baseHealth: x.base_health,
      baseHealthRegen: x.base_health_regen,
      baseMana: x.base_mana,
      baseManaRegen: x.base_mana_regen,
      baseArmor: x.base_armor,
      baseMagicResistance: x.base_mr,
      baseAttackMin: x.base_attack_min,
      baseAttackMax: x.base_attack_max,
      baseStr: x.base_str,
      baseAgi: x.base_agi,
      baseInt: x.base_int,
      strGain: x.str_gain,
      agiGain: x.agi_gain,
      intGain: x.int_gain,
      attackRange: x.attack_range,
      projectileSpeed: x.projectile_speed,
      attackRate: x.attack_rate,
      baseAttackTime: x.base_attack_time,
      attackPoint: x.attack_point,
      moveSpeed: x.move_speed,
      cmEnabled: x.cm_enabled,
      dayVision: x.day_vision,
      nightVision: x.night_vision,
    };
  }
  return dictionary;
}
