import { Hero, HeroDictionary } from '@/lib/dota/hero';
import Image from 'next/image';
import React from 'react';

export function GroupedHeroStatsTable({ data }: { data: HeroDictionary }) {
  // Group heroes by armor value
  const groupedHeroes = Object.values(data).reduce<Record<number, Hero[]>>(
    (acc, hero) => {
      const armorValue = hero.baseArmor;
      acc[armorValue] ??= [];
      acc[armorValue].push(hero);
      return acc;
    },
    {},
  );

  // Sort armor values in ascending order
  const sortedArmorValues = Object.keys(groupedHeroes)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="w-full max-w-4xl">
      <table className="w-full border-collapse bg-gray-800 text-white">
        <thead>
          <tr className="bg-red-800">
            <th className="w-24 border border-gray-600 px-4 py-3 text-center font-bold">
              Armor
            </th>
            <th className="border border-gray-600 px-4 py-3 text-left font-bold">
              Heroes
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedArmorValues.map((armorValue) => (
            <tr key={armorValue} className="hover:bg-gray-700">
              <td className="border border-gray-600 px-4 py-3 text-center font-bold">
                {armorValue}
              </td>
              <td className="border border-gray-600 px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {Object.entries(data).map(([heroName, hero]) => (
                    <div
                      key={heroName}
                      className="flex items-center justify-center"
                      title={heroName}
                    >
                      <Image
                        src={hero.iconImage}
                        alt={heroName}
                        width={32}
                        height={32}
                        className="mr-2 inline-block"
                      />
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
