import { Graph } from '@/components/graph'
import { HomeButton } from '@/components/home-button'
import { SearchBar } from '@/components/search-bar'
import { createDb } from '@/db/connection'
import { getRatings } from '@/lib/imdb/ratings'
import { type Ratings } from '@/lib/imdb/types'
import { createFileRoute, notFound } from '@tanstack/react-router'

function hasRatings(ratings: Ratings): boolean {
	for (const seasonRatings of Object.values(ratings.allEpisodeRatings)) {
		for (const episode of Object.values(seasonRatings)) {
			if (episode.numVotes > 0) {
				return true
			}
		}
	}
	return false
}

export const Route = createFileRoute('/ratings/$id')({
	component: Ratings,
	loader: async ({ params }) => {
		const showId = params.id
		if (!showId) {
			throw notFound()
		}

		let ratings: Ratings | undefined

		if (import.meta.env.SSR) {
			ratings = await getRatings(createDb(), showId)
		} else {
			const response = await fetch(
				`/api/ratings?id=${encodeURIComponent(showId)}`,
			)

			if (response.status === 404) {
				throw notFound()
			}

			if (!response.ok) {
				throw new Error(`Failed to load ratings for ${showId}`)
			}

			ratings = (await response.json()) as Ratings
		}

		if (!ratings) {
			throw notFound()
		}

		return ratings
	},
})

function Ratings() {
	const ratings = Route.useLoaderData()

	return (
		<>
			<header className="flex justify-center gap-2 border-b px-5 py-3">
				<HomeButton />
				<SearchBar className="max-w-md" />
			</header>
			<main data-testid="ratings-content">
				{!hasRatings(ratings) ? (
					<h1 className="pt-8 text-center text-6xl leading-tight">
						No Ratings Found
					</h1>
				) : (
					<Graph ratings={ratings} />
				)}
			</main>
		</>
	)
}
