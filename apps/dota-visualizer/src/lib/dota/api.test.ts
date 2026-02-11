import { fetchLatestHeroData } from '@/lib/dota/api'
import { test } from '@aamini/config-testing/test/server'
import { expect } from 'vitest'

test('Parsing Anti-Mage', async () => {
	const allHeroes = await fetchLatestHeroData()
	expect(allHeroes.get('Anti-Mage')).toMatchInlineSnapshot(`
      {
        "agiGain": 2.8,
        "attackPoint": 0.3,
        "attackRange": 150,
        "attackRate": 1.4,
        "attackType": "Melee",
        "baseAgi": 24,
        "baseArmor": 1,
        "baseAttackMax": 33,
        "baseAttackMin": 29,
        "baseAttackTime": 100,
        "baseHealth": 120,
        "baseHealthRegen": 1,
        "baseInt": 12,
        "baseMagicResistance": 25,
        "baseMana": 75,
        "baseManaRegen": 0,
        "baseStr": 21,
        "cmEnabled": true,
        "dayVision": 1800,
        "iconImage": "https://cdn.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/antimage.png?",
        "intGain": 1.8,
        "moveSpeed": 310,
        "name": "Anti-Mage",
        "nightVision": 800,
        "primaryAttribute": "agi",
        "projectileSpeed": 0,
        "roles": [
          "Carry",
          "Escape",
          "Nuker",
        ],
        "strGain": 1.6,
      }
    `)
})
