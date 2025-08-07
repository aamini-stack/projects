import { column, defineDb, defineTable } from 'astro:db'

const Show = defineTable({
	columns: {
		imdbId: column.text({ primaryKey: true }),
		title: column.text(),
		startYear: column.text(),
		endYear: column.text({ optional: true }),
		rating: column.number({ default: 0 }),
		numVotes: column.number({ default: 0 }),
	},
})

const Episode = defineTable({
	columns: {
		showId: column.text({ references: () => Show.columns.imdbId }),
		episodeId: column.text({ primaryKey: true }),
		title: column.text(),
		seasonNum: column.number(),
		episodeNum: column.number(),
		rating: column.number(),
		numVotes: column.number(),
	},
})

// https://astro.build/db/config
export default defineDb({
	tables: { Show, Episode },
})
