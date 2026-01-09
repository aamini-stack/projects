import { HeroStats } from '@/components/hero-stats'
import { HeroTable } from '@/components/hero-table'
import { fetchLatestHeroData } from '@/lib/dota/api'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	loader: async () => await fetchLatestHeroData(),
	component: Index,
})

function Index() {
	const heroDictionary = Route.useLoaderData()

	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-24">
			<h1 className="mb-8 text-4xl font-bold text-gray-900">
				Dota 2 Hero Stats
			</h1>
			<HeroStats heroDictionary={heroDictionary} />
			<HeroTable heroDictionary={heroDictionary} />
		</main>
	)
}
