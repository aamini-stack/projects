import { download } from '#/lib/imdb/file-downloader'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { Pool, PoolClient } from 'pg'
import { from as copyFrom } from 'pg-copy-streams'

/**
 * Main method that downloads the latest files from IMDB and updates our
 * internal database with the latest data.
 */
export async function update(
	db: NodePgDatabase & {
		$client: Pool
	},
): Promise<void> {
	const client = await db.$client.connect()
	console.log('Connected to db. Starting database population...')
	const startTime = Date.now()
	try {
		await client.query('BEGIN')
		await transfer(client)
		await client.query('COMMIT')

		const duration = ((Date.now() - startTime) / 1000).toFixed(2)
		console.log(
			`✅ Database population completed successfully in ${duration} seconds!`,
		)
	} catch (error) {
		console.error('❌ Database population failed:')
		console.error(error)
		throw error
	} finally {
		client.release()
	}
}

/**
 * Download files and store them in temp tables using efficient bulk operations.
 * Once all data is loaded into temp tables, update all the real tables with
 * data from the temp tables.
 */
async function transfer(client: PoolClient) {
	await client.query(`
    CREATE TEMPORARY TABLE temp_title
    (
        imdb_id         VARCHAR(10),
        title_type      TEXT,
        primary_title   TEXT,
        original_title  TEXT,
        is_adult        BOOLEAN,
        start_year      CHAR(4),
        end_year        CHAR(4),
        runtime_minutes INT,
        genres          TEXT
    ) ON COMMIT DROP;
    
    CREATE TEMPORARY TABLE temp_episode
    (
        episode_id  VARCHAR(10),
        show_id     VARCHAR(10),
        season_num  INT,
        episode_num INT
    ) ON COMMIT DROP;
    
    CREATE TEMPORARY TABLE temp_ratings
    (
        imdb_id     VARCHAR(10) PRIMARY KEY,
        imdb_rating DOUBLE PRECISION,
        num_votes   INT
    ) ON COMMIT DROP;
  `)

	// Download files and store them in temp tables.
	const tempDir = path.join(tmpdir(), `imdb-run-${randomUUID()}`)
	await mkdir(tempDir)
	console.log('Starting downloads...')
	await download('title.basics.tsv.gz', path.join(tempDir, 'titles.tsv'))
	await download('title.episode.tsv.gz', path.join(tempDir, 'episodes.tsv'))
	await download('title.ratings.tsv.gz', path.join(tempDir, 'ratings.tsv'))

	const copy = async (file: string, cmd: string) => {
		const sourceStream = createReadStream(file)
		const ingestStream = client.query(copyFrom(cmd))
		await pipeline(sourceStream, ingestStream)
		console.log(`Successfully transferred ${file} to table temp_title`)
	}

	console.log('Starting file to temp table transfers...')
	await copy(
		path.join(tempDir, 'titles.tsv'),
		`COPY temp_title FROM STDIN WITH (DELIMITER '\t', HEADER TRUE) 
    WHERE title_type IN ('tvSeries', 'tvEpisode', 'tvShort', 'tvSpecial', 'tvMiniSeries') AND start_year IS NOT NULL;`,
	)
	await copy(
		path.join(tempDir, 'episodes.tsv'),
		"COPY temp_episode FROM STDIN WITH (DELIMITER '\t', HEADER TRUE);",
	)
	await copy(
		path.join(tempDir, 'ratings.tsv'),
		"COPY temp_ratings FROM STDIN WITH (DELIMITER '\t', HEADER TRUE);",
	)

	/*
	 * Download files and store them in temp tables using the Postgres copy
	 * command. This is the most efficient way to bulk update data from files
	 * into a postgres database. Once all data is loaded into temp tables,
	 * update all the real tables with data from the temp tables.
	 *
	 * https://stackoverflow.com/a/17267423/6310030
	 * https://www.postgresql.org/docs/current/populate.html
	 * https://dba.stackexchange.com/questions/41059/optimizing-bulk-update-performance-in-postgresql
	 */

	// Update episode table using new data from temp tables
	await client.query('DROP TABLE IF EXISTS episode_new;')
	await client.query('DROP TABLE IF EXISTS show_new;')
	console.log('Cleared old tables')

	await client.query(`
    CREATE TEMPORARY TABLE valid_shows ON COMMIT DROP AS
    SELECT imdb_id FROM temp_title JOIN temp_ratings USING (imdb_id)
    WHERE 
      title_type IN ('tvSeries', 'tvShort', 'tvSpecial', 'tvMiniSeries') AND 
      num_votes > 0 AND
      imdb_id IN (
        SELECT show_id
        FROM temp_episode JOIN temp_ratings ON (episode_id = imdb_id)
        GROUP BY show_id
        HAVING sum(num_votes) > 0
      )
  `)

	await client.query(`
    CREATE TABLE show_new AS
    SELECT
      tt.imdb_id,
      tt.primary_title as title,
      tt.start_year,
      tt.end_year,
      COALESCE(tr.imdb_rating, 0.0) AS rating,
      COALESCE(tr.num_votes, 0) AS num_votes
    FROM temp_title tt JOIN temp_ratings tr ON tt.imdb_id = tr.imdb_id
    WHERE tt.imdb_id IN (SELECT imdb_id FROM valid_shows)
  `)

	await client.query(`
    CREATE TABLE episode_new AS
    SELECT 
      show_id,
      episode_id,
      primary_title as title,
      season_num,
      episode_num,
      COALESCE(imdb_rating, 0.0) as rating,
      COALESCE(num_votes, 0) as num_votes
    FROM temp_episode 
      JOIN temp_title ON (episode_id = imdb_id) 
      JOIN temp_ratings USING (imdb_id)
    WHERE 
      show_id IN (select imdb_id FROM valid_shows) AND 
      season_num > 0 AND
      episode_num > 0
  `)

	// Drop foreign key constraint from thumbnail table before dropping show table
	await client.query(`
		ALTER TABLE IF EXISTS thumbnail
		DROP CONSTRAINT IF EXISTS thumbnail_show_imdb_id_fk;
	`)

	await client.query('DROP TABLE IF EXISTS episode;')
	await client.query('DROP TABLE IF EXISTS show;')

	await client.query(`
    ALTER TABLE show_new RENAME TO show;
	  ALTER TABLE show ALTER COLUMN imdb_id SET NOT NULL;
	  ALTER TABLE show ALTER COLUMN title SET NOT NULL;
	  ALTER TABLE show ALTER COLUMN start_year SET NOT NULL;
	  ALTER TABLE show ALTER COLUMN rating SET NOT NULL;
	  ALTER TABLE show ALTER COLUMN num_votes SET NOT NULL;

    ALTER TABLE show ADD PRIMARY KEY (imdb_id);
	`)
	console.log('Updated show table')

	// Re-add foreign key constraint to thumbnail table
	await client.query(`
		ALTER TABLE IF EXISTS thumbnail
		ADD CONSTRAINT thumbnail_show_imdb_id_fk
		FOREIGN KEY (imdb_id) REFERENCES show(imdb_id);
	`)
	console.log('Re-added thumbnail foreign key constraint')

	await client.query(`
    ALTER TABLE episode_new RENAME TO episode;
	  ALTER TABLE episode ALTER COLUMN show_id SET NOT NULL;
	  ALTER TABLE episode ALTER COLUMN episode_id SET NOT NULL;
	  ALTER TABLE episode ALTER COLUMN season_num SET NOT NULL;
	  ALTER TABLE episode ALTER COLUMN episode_num SET NOT NULL;
	  ALTER TABLE episode ALTER COLUMN rating SET NOT NULL;
	  ALTER TABLE episode ALTER COLUMN num_votes SET NOT NULL;

    ALTER TABLE episode ADD PRIMARY KEY (episode_id);
    ALTER TABLE episode ADD FOREIGN KEY (show_id) REFERENCES show(imdb_id);
	  CREATE INDEX ON episode (show_id);
	`)
	console.log('Updated episode table')

	console.log('Database migration successfull')
}
