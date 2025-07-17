import { db } from '../connection';
import { download, ImdbFile } from '../data/file-downloader';
import { getRatings } from '../data/ratings';
import { update } from '../data/scraper';
import { fetchSuggestions } from '../data/suggestions';
import { episode, show } from '../tables/schema';
import {
  allEpisodes,
  allShows,
  avatarRatings,
  gameOfThronesRatings,
  simpsonsRatings,
} from './mocks/expected-data';
import { setUpSchema, wipeDb } from './setup-db';
import fs from 'fs/promises';
import path from 'path';

// =============================================================================
// Mocks
// =============================================================================
jest.mock('../data/file-downloader');

const dataDirectory = './mocks';

function mockDownloads(mockedFiles: Record<ImdbFile, string>) {
  const fakeDownloadFn = async (imdbFile: ImdbFile, output: string) => {
    const inputFile = path.join(__dirname, mockedFiles[imdbFile]);
    await fs.copyFile(inputFile, output);
  };

  jest.mocked(download).mockImplementation(fakeDownloadFn);
}

// =============================================================================
// Tests
// =============================================================================
beforeAll(async () => {
  await wipeDb();
  await setUpSchema();
});

describe('Sequential Database Tests', () => {
  test('Loading sample files into database', async () => {
    mockDownloads({
      'title.basics.tsv.gz': `${dataDirectory}/titles.tsv`,
      'title.episode.tsv.gz': `${dataDirectory}/episodes.tsv`,
      'title.ratings.tsv.gz': `${dataDirectory}/ratings.tsv`,
    });

    await update();

    expect(await db.select().from(show)).toEqual(allShows);
    expect(await db.select().from(episode)).toEqual(allEpisodes);
  });

  test('Handling bad files', async () => {
    mockDownloads({
      'title.basics.tsv.gz': `${dataDirectory}/titles.tsv`,
      'title.episode.tsv.gz': `${dataDirectory}/bad-episodes.tsv`, // <- Bad file!
      'title.ratings.tsv.gz': `${dataDirectory}/ratings.tsv`,
    });

    await expect(update()).rejects.toThrow('Error updating database');
  });

  test('Ratings Query', async () => {
    expect(await getRatings('tt0417299')).toEqual(avatarRatings);
    expect(await getRatings('tt0944947')).toEqual(gameOfThronesRatings);
    expect(await getRatings('tt0096697')).toEqual(simpsonsRatings);
  });

  test('Searching: Avatar', async () => {
    const results = await fetchSuggestions('Av');
    expect(results?.map((show) => show.title)).toEqual([
      'Avatar: The Last Airbender',
      'Avatar: The Last Airbender',
      'Avenue 5',
      'Avrupa Yakasi',
      'Avengers Assemble',
    ]);
  });

  test('Searching: King of The Hill', async () => {
    const results = await fetchSuggestions('King of');
    expect(results?.map((show) => show.title)).toEqual([
      'King of the Hill',
      'King of the Narrow Sea',
      'King of Kings',
      'King of Mirzapur',
      'King of the Damned',
    ]);
  });
});
