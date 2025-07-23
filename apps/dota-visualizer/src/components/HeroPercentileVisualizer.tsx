'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/select';
import { type HeroDictionary } from '@/lib/dota/hero';
import { useState } from 'react';

export function HeroPercentileVisualizer({
  heroes,
}: {
  heroes: HeroDictionary;
}) {
  const [name, setName] = useState('Anti-Mage');

  const hero = heroes[name];
  if (!hero) {
    return undefined;
  }

  const generateStats = (): {
    statName: string;
    value: number;
    percentile: number;
  }[] => {
    return Object.entries(heroes).map(([heroName, hero]) => {
      return {
        statName: heroName,
        value: hero.agiGain,
        percentile: 0,
      };
    });
  };

  return (
    <div className="mb-8 w-full max-w-4xl">
      <div className="mb-4">
        <Select
          value={name}
          onValueChange={(name) => {
            setName(name);
          }}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a hero" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(heroes).map((heroName) => (
              <SelectItem key={heroName} value={heroName}>
                {heroName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <h2 className="text-2xl font-bold capitalize">{name}</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {generateStats().map(({ statName, value, percentile }) => (
            <div key={statName} className="rounded border p-4">
              <div className="text-sm font-medium text-gray-500">
                {statName}
              </div>
              <div className="text-lg font-bold">{String(value)}</div>
              <div className="text-sm text-gray-500">
                {Math.round(Number(percentile) * 100)}th percentile
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
