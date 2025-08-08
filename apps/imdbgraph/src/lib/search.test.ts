import { expect, test } from 'vitest'
import shows from './__fixtures__/shows.json'
import { SearchCache } from './search'

const searchCache = new SearchCache(shows)

test('exact title', () => {
	const results = searchCache.search('Game of Thrones')
	expect(results[0]).toEqual({
		title: 'Game of Thrones',
		imdbId: 'tt0944947',
		startYear: '2011',
		endYear: '2019',
		rating: 9.2,
		numVotes: 2453952,
	})
})

test('prefix search', () => {
	const results = searchCache.search('breaking')
	expect(results[0]).toEqual({
		title: 'Breaking Bad',
		imdbId: 'tt0903747',
		startYear: '2008',
		endYear: '2013',
		rating: 9.5,
		numVotes: 2358716,
	})
})

test('handling typos', () => {
	const results = searchCache.search('strnger thgs')
	expect(results[0]).toEqual({
		title: 'Stranger Things',
		imdbId: 'tt4574334',
		startYear: '2016',
		endYear: '2025',
		rating: 8.6,
		numVotes: 1462384,
	})
})

test('non-existent results', () => {
	const results = searchCache.search('NonExistentShow')
	expect(results).toHaveLength(0)
})

test('generic search', () => {
	const results = searchCache.search('The')
	expect(results).toMatchInlineSnapshot(`
    [
      {
        "endYear": "2019",
        "imdbId": "tt0898266",
        "numVotes": 912870,
        "rating": 8.1,
        "startYear": "2007",
        "title": "The Big Bang Theory",
      },
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
        "imdbId": "tt8111088",
        "numVotes": 630839,
        "rating": 8.6,
        "startYear": "2019",
        "title": "The Mandalorian",
      },
      {
        "endYear": null,
        "imdbId": "tt7631058",
        "numVotes": 427397,
        "rating": 6.9,
        "startYear": "2022",
        "title": "The Lord of the Rings: The Rings of Power",
      },
    ]
  `)
})
