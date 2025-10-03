import type { Ratings } from '#/lib/imdb/types'
import '#/components/graph/highcharts.css'
import 'highcharts/esm/modules/accessibility'

export function BlockGraph({ ratings }: { ratings: Ratings }) {
	return (
		<div className='h-full w-full'>
			{ratings.allEpisodeRatings.toString()}
		</div>
	)
}
