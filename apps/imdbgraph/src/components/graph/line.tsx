import type { Episode, Ratings } from '#/lib/imdb/types'
import { theme } from '#/lib/store'
import '#/components/graph/highcharts.css'
import { cn } from '@aamini/ui/lib/utils'
import { useStore } from '@nanostores/react'
import Highcharts from 'highcharts'
import { HighchartsReact } from 'highcharts-react-official'
import 'highcharts/esm/modules/accessibility'

export function LineGraph({ ratings }: { ratings: Ratings }) {
	const $theme = useStore(theme)
	return (
		<div
			className={cn('h-full w-full', {
				'highcharts-dark': $theme === 'dark',
				'highcharts-light': $theme === 'theme-light',
			})}
		>
			<HighchartsReact
				highcharts={Highcharts}
				options={{
					...options,
					series: parseRatings(ratings),
				}}
			/>
		</div>
	)
}

interface Point {
	x: number
	y?: number
	custom?: { episode: Episode }
}

/** Transform data into a format that Highcharts understands. */
function parseRatings(ratings: Ratings): Highcharts.SeriesSplineOptions[] {
	let i = 1
	const allSeries: Highcharts.SeriesSplineOptions[] = []
	for (const [seasonNumber, seasonRatings] of Object.entries(
		ratings.allEpisodeRatings,
	)) {
		const data = []
		for (const episode of Object.values(seasonRatings)) {
			if (episode.numVotes === 0) {
				// ignore episodes without ratings
				continue
			}

			data.push({
				x: i,
				y: episode.rating,
				custom: {
					episode: episode,
				},
			})
			i++
		}

		const series: Highcharts.SeriesSplineOptions = {
			name: `Season ${seasonNumber}`,
			type: 'spline',
			data: data,
		}
		if (data.length > 0) {
			allSeries.push(series)
		}
	}
	return allSeries
}

const options: Highcharts.Options = {
	title: {
		text: '',
	},

	xAxis: {
		visible: false,
	},

	yAxis: {
		title: {
			text: '',
		},
		max: 10,
		tickInterval: 1,
	},

	chart: {
		styledMode: true,
		zooming: {
			type: 'x',
			mouseWheel: true,
		},
		panning: {
			type: 'xy',
			enabled: true,
		},
	},

	accessibility: {
		description: 'A graph showing all the episode ratings of TV show',
	},

	plotOptions: {
		spline: {
			animation: false,
			dataLabels: {
				enabled: true,
			},
		},
	},

	tooltip: {
		shared: false,
		headerFormat: '',
		followTouchMove: false, // Allow panning on mobile
		footerFormat: '',
		valueDecimals: 2,
		// CAN NOT BE AN ARROW FUNCTION BECAUSE OF 'THIS' KEYWORD
		pointFormatter: function (this: Point) {
			const episode = this.custom?.episode
			if (episode) {
				return `
                    ${episode.title} (s${episode.seasonNum.toString()}e${episode.episodeNum.toString()})
                    <br><br>
                    Rating: ${episode.rating.toFixed(1)} (${episode.numVotes.toLocaleString()} votes)
                `
			} else {
				return 'Error: Missing Data'
			}
		},
	},

	credits: {
		enabled: false,
	},
}
