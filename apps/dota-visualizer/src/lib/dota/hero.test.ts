import mockHeroes from './__fixtures__/opendota.json';
import { fetchLatestHeroData } from './hero';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';

const handlers = [
  http.get('https://api.opendota.com/api/heroStats', () =>
    HttpResponse.json(mockHeroes),
  ),
];

const server = setupServer(...handlers);
beforeAll(() => {
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

test('Anti-Mage', async () => {
  expect(await fetchLatestHeroData()).toMatchInlineSnapshot(`
    {
      "Anti-Mage": {
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
        "nightVision": 800,
        "primaryAttribute": "agi",
        "projectileSpeed": 0,
        "roles": [
          "Carry",
          "Escape",
          "Nuker",
        ],
        "strGain": 1.6,
      },
    }
  `);
});
