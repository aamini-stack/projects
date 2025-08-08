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

test('multiple shows', () => {
	const results = searchCache.search('The')
	expect(results.length).toBeGreaterThan(1)
})
