import MiniSearch from 'minisearch'
import type { Show } from '@/lib/types'

export class SearchCache {
	private readonly shows: Show[]
	private readonly index: MiniSearch

	public constructor(shows: Show[]) {
		this.shows = shows
		this.index = new MiniSearch<Show>({
			fields: ['title'], // fields to index for full-text search
			storeFields: [
				'title',
				'imdbId',
				'startYear',
				'endYear',
				'rating',
				'numVotes',
			], // fields to return with search results
			idField: 'imdbId',
			searchOptions: {
				prefix: true,
				fuzzy: 0.2,
			},
		})

		this.index.addAll(this.shows)
	}

	public search(q: string) {
		const results = this.index.search(q)
		return results.slice(0, 5).map((result) => ({
			imdbId: result.imdbId,
			title: result.title,
			startYear: result.startYear,
			endYear: result.endYear,
			rating: result.rating,
			numVotes: result.numVotes,
		}))
	}
}
