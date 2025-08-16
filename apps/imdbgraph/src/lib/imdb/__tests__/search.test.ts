import { testWithDb } from '__mocks__/setup-db'
import { show } from 'db/tables'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { describe, expect } from 'vitest'
import { fetchSuggestions } from '@/lib/imdb/search'
import { shows } from './fixtures/shows'

async function setUpData(db: NodePgDatabase) {
	await db.insert(show).values(shows)
}

describe('search tests', () => {
	testWithDb.scoped({
		seedFunction: [async ({}, use) => use(setUpData), { scope: 'file' }],
	})

	testWithDb('exact title', async ({ db }) => {
		const results = await fetchSuggestions(db, 'Game of Thrones')
		expect(results[0]).toEqual({
			title: 'Game of Thrones',
			imdbId: 'tt0944947',
			startYear: '2011',
			endYear: '2019',
			rating: 9.2,
			numVotes: 2453952,
		})
	})

	testWithDb('prefix search', async ({ db }) => {
		const results = await fetchSuggestions(db, 'breaking')
		expect(results[0]).toEqual({
			title: 'Breaking Bad',
			imdbId: 'tt0903747',
			startYear: '2008',
			endYear: '2013',
			rating: 9.5,
			numVotes: 2358716,
		})
	})

	testWithDb('handling typos', async ({ db }) => {
		const results = await fetchSuggestions(db, 'strnger thgs')
		expect(results[0]).toEqual({
			title: 'Stranger Things',
			imdbId: 'tt4574334',
			startYear: '2016',
			endYear: '2025',
			rating: 8.6,
			numVotes: 1462384,
		})
	})

	testWithDb('non-existent results', async ({ db }) => {
		const results = await fetchSuggestions(db, 'NonExistentShow')
		expect(results).toHaveLength(0)
	})

	testWithDb('generic search', async ({ db }) => {
		const results = await fetchSuggestions(db, 'The')
		expect(results).toMatchInlineSnapshot(`
			[
			  {
			    "endYear": null,
			    "imdbId": "tt1190634",
			    "numVotes": 788118,
			    "rating": 8.6,
			    "startYear": "2019",
			    "title": "The Boys",
			  },
			  {
			    "endYear": "2013",
			    "imdbId": "tt0386676",
			    "numVotes": 783172,
			    "rating": 9,
			    "startYear": "2005",
			    "title": "The Office",
			  },
			  {
			    "endYear": null,
			    "imdbId": "tt5180504",
			    "numVotes": 597967,
			    "rating": 7.9,
			    "startYear": "2019",
			    "title": "The Witcher",
			  },
			  {
			    "endYear": "2007",
			    "imdbId": "tt0141842",
			    "numVotes": 532849,
			    "rating": 9.2,
			    "startYear": "1999",
			    "title": "The Sopranos",
			  },
			  {
			    "endYear": null,
			    "imdbId": "tt0096697",
			    "numVotes": 456169,
			    "rating": 8.6,
			    "startYear": "1989",
			    "title": "The Simpsons",
			  },
			]
		`)
	})
})
