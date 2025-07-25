'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/select';
import { HeroDictionary, HeroName } from '@/lib/dota/hero';
import {
  Attribute,
  attributes,
  HeroStatsAnalyzer,
} from '@/lib/dota/hero-percentiles';
import Image from 'next/image';
import { useMemo, useState } from 'react';

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
};

export function HeroStats({
  heroDictionary,
}: {
  heroDictionary: HeroDictionary;
}) {
  const [name, setName] = useState<HeroName>('Anti-Mage');
  const heroStats = useMemo(
    () => new HeroStatsAnalyzer(heroDictionary),
    [heroDictionary],
  );

  const hero = heroDictionary.get(name);
  if (!hero) {
    throw new Error('Missing hero');
  }

  function HeroSelect({
    value,
    onChange,
  }: {
    value: HeroName;
    onChange: (name: HeroName) => void;
  }) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[280px]">
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
    );
  }

  return (
    <div className="mb-8 w-full max-w-4xl">
      <div className="mb-4">
        <HeroSelect
          value={name}
          onChange={(newName) => {
            setName(newName);
          }}
        />
      </div>
      <div>
        <h2 className="flex text-2xl font-bold capitalize gap-2">
          {name} <Image src={hero.iconImage} alt="" width={32} height={32} />
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
          {attributes.map((attr) => (
            <div key={attr} className="rounded border p-4">
              <div className="text-sm font-bold overflow-hidden whitespace-nowrap truncate">
                {displayNames[attr]}: {hero[attr]}
              </div>
              <div className="text-sm text-gray-500">
                {(() => {
                  const percentile = Math.round(
                    Number(heroStats.computePercentile(name, attr) * 100),
                  );
                  return (
                    <span style={{ color: getPercentileColor(percentile) }}>
                      {percentile}th percentile
                    </span>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getPercentileColor(percentile: number): string {
  let r, g, b;

  if (percentile <= 50) {
    // Interpolate from Red (255, 0, 0) to Orange-Yellow (255, 165, 0)
    // Red stays at 255, Green increases from 0 to 165
    r = 255;
    g = Math.round((percentile / 50) * 165);
    b = 0;
  } else {
    // Interpolate from Orange-Yellow (255, 165, 0) to Green (0, 255, 0)
    // Red decreases from 255 to 0, Green increases from 165 to 255
    r = Math.round(((100 - percentile) / 50) * 255);
    g = Math.round(165 + ((percentile - 50) / 50) * (255 - 165));
    b = 0;
  }

  return `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
}
