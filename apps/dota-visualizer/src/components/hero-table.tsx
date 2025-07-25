import { HeroDictionary } from '@/lib/dota/hero';
import Image from 'next/image';
import React from 'react';

export function HeroTable({
  heroDictionary,
}: {
  heroDictionary: HeroDictionary;
}) {
  // Group heroes by armor value
  interface ArmorStat {
    name: string;
    icon: string;
    armor: number;
  }

  const groupedHeroesByArmor: Record<string, ArmorStat[]> = {};
  for (const [heroName, hero] of heroDictionary) {
    const armor = hero.baseArmor;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    groupedHeroesByArmor[armor] ??= [];
    groupedHeroesByArmor[armor].push({
      name: heroName,
      armor: hero.baseArmor,
      icon: hero.iconImage,
    });
  }

  // Sort armor values in ascending order
  const sortedArmorValues = Object.keys(groupedHeroesByArmor)
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
          {sortedArmorValues.map((armor) => (
            <tr key={armor} className="hover:bg-gray-700">
              <td className="border border-gray-600 px-4 py-3 text-center font-bold">
                {armor}
              </td>
              <td className="border border-gray-600 px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {groupedHeroesByArmor[armor]?.map((hero) => (
                    <div
                      key={hero.name}
                      className="flex items-center justify-center"
                      title={hero.name}
                    >
                      <Image
                        src={hero.icon}
                        alt={hero.name}
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
