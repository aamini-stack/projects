import fs from 'node:fs/promises'
import path from 'node:path'
import { test } from '__mocks__/setup-db'
import { describe, expect, vi } from 'vitest'
import { gameOfThronesRatings } from '@/lib/imdb/__tests__/fixtures/game-of-thrones'
import { download, type ImdbFile } from '@/lib/imdb/file-downloader'
import { getRatings } from '@/lib/imdb/ratings'
import { update } from '@/lib/imdb/scraper'

vi.mock(import('@/lib/imdb/file-downloader'))

const GAME_OF_THRONES_ID = 'tt0944947'
const SIMPSONS_ID = 'tt0096697'

// =============================================================================
// Tests
// =============================================================================
describe('scraper tests', () => {
	test('loading sample files into database', async ({ db }) => {
		mockDownloads({
			'title.basics.tsv.gz': './fixtures/imdb-files/titles.tsv',
			'title.episode.tsv.gz': './fixtures/imdb-files/episodes.tsv',
			'title.ratings.tsv.gz': './fixtures/imdb-files/ratings.tsv',
		})

		await update(db)

		expect(await getRatings(db, GAME_OF_THRONES_ID)).toEqual(
			gameOfThronesRatings,
		)
		expect(await getRatings(db, SIMPSONS_ID)).toBeUndefined()
	})

	test('handling bad files', async ({ db }) => {
		mockDownloads({
			'title.basics.tsv.gz': './fixtures/imdb-files/titles.tsv',
			'title.episode.tsv.gz': './fixtures/imdb-files/bad-episodes.tsv',
			'title.ratings.tsv.gz': './fixtures/imdb-files/ratings.tsv',
		})
		await expect(update(db)).rejects.toThrow(
			'invalid input syntax for type integer: "5   corrupt-data 1212"',
		)
	})
})

// =============================================================================
// Helpers
// =============================================================================
function mockDownloads(mockedFiles: Record<ImdbFile, string>) {
	vi.mocked(download).mockImplementation(async (imdbFile, out) => {
		const input = path.join(import.meta.dirname, mockedFiles[imdbFile])
		await fs.copyFile(input, out)
	})
}
