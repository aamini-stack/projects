import { GroupedHeroStatsTable } from '@/components/GroupedHeroStatsTable';
import { HeroPercentileVisualizer } from '@/components/HeroPercentileVisualizer';
import { fetchLatestHeroData } from '@/lib/dota/hero';

export default async function Home() {
  const heroes = await fetchLatestHeroData();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="mb-8 text-4xl font-bold">Dota 2 Hero Stats</h1>
      <HeroPercentileVisualizer heroes={heroes} />
      <GroupedHeroStatsTable data={heroes} />
    </main>
  );
}
