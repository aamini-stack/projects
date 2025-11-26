import { Readable } from 'node:stream'
import type { ReadableStream } from 'node:stream/web'
import { createGunzip } from 'node:zlib'

// https://www.imdb.com/interfaces
const baseUri = 'https://datasets.imdbws.com'
export type ImdbFile =
	| 'title.basics.tsv.gz'
	| 'title.episode.tsv.gz'
	| 'title.ratings.tsv.gz'

/**
 * Fetches a gzipped file from IMDB and returns a decompressed readable stream.
 * This avoids writing to disk, which is important for serverless environments
 * with limited disk space.
 */
export async function getGunzipStream(file: ImdbFile): Promise<Readable> {
	const uri = `${baseUri}/${file}`
	const { body, ok, status } = await fetch(uri)
	if (!ok) {
		throw new Error(`HTTP error! status: ${status.toString()}`)
	}
	if (!body) {
		throw new Error('Response body is null')
	}
	const gunzip = createGunzip()
	Readable.fromWeb(body as ReadableStream).pipe(gunzip)
	return gunzip
}
