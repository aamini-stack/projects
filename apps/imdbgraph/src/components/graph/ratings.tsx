import { LineGraph } from '#/components/graph/line'
import type { Ratings } from '#/lib/imdb/types'
import { useState } from 'react'
import {
	ToggleGroup,
	ToggleGroupItem,
} from '@aamini/ui/components/toggle-group'
import { BlockGraph } from '#/components/graph/block'

type GraphViewType = 'line' | 'block'

export function RatingsGraph({ ratings }: { ratings: Ratings }) {
	const [viewType, setViewType] = useState<GraphViewType>('line')

	return (
		<div className="h-full w-full flex-1 flex-col gap-4">
			{/* Graph Display */}
			<div className="h-full w-full flex-1">
				{viewType === 'line' ? (
					<LineGraph ratings={ratings} />
				) : (
					<BlockGraph ratings={ratings} />
				)}
			</div>

			{/* Toggle Controls */}
			<div className="flex items-center justify-center">
				<ToggleGroup
					onValueChange={(value) => {
						console.log(value)
						setViewType(value === 'block' ? 'block' : 'line')
					}}
					type="single"
					aria-label="Graph View Type Selector"
				>
					<ToggleGroupItem value="line" about="Line graph view">
						Line
					</ToggleGroupItem>

					<ToggleGroupItem value="block" about="Block grid view">
						Block
					</ToggleGroupItem>
				</ToggleGroup>
			</div>
		</div>
	)
}
