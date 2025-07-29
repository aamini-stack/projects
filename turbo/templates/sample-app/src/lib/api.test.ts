import { expect, test } from 'vitest';

test('Parsing Anti-Mage', async () => {
  const resp = await fetch('https://api.opendota.com/api/heroStats');
  const data = (await resp.json()) as object;
  expect(data).toMatchInlineSnapshot(`
    [
      {
        "attack_type": "Melee",
        "base_health": 120,
        "base_health_regen": 1,
        "id": 1,
        "name": "npc_dota_hero_antimage",
        "primary_attr": "agi",
        "roles": [
          "Carry",
          "Escape",
          "Nuker",
        ],
      },
    ]
  `);
});
