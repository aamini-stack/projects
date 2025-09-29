<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { theme } from '$lib/store'
	import Highcharts from 'highcharts'
	import HighchartsReact from 'highcharts-react-official'
	import 'highcharts/esm/modules/accessibility'
	
	export let ratings: any
	
	let chartOptions: any = {}
	let chartInstance: any = null
	
	// Parse ratings data for Highcharts
	function parseRatings(ratings: any): Highcharts.SeriesSplineOptions[] {
		let i = 1
		const allSeries: Highcharts.SeriesSplineOptions[] = []
		for (const [seasonNumber, seasonRatings] of Object.entries(
			ratings.allEpisodeRatings,
		)) {
			const data = []
			for (const episode of Object.values(seasonRatings as any)) {
				if ((episode as any).numVotes === 0) {
					// ignore episodes without ratings
					continue
				}
				
				data.push({
					x: i,
					y: (episode as any).rating,
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
	
	// Initialize chart options
	onMount(() => {
		chartOptions = {
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
				pointFormatter: function (this: any) {
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
	})
	
	// Update chart when ratings change
	$: {
		if (ratings) {
			chartOptions.series = parseRatings(ratings)
		}
	}
</script>

<div class="h-full w-full">
	{#if ratings}
		<HighchartsReact
			highcharts={Highcharts}
			options={chartOptions}
		/>
	{:else}
		<div class="flex flex-1 items-center justify-center">
			<h1 class="animate-pulse rounded-md text-xl">LOADING...</h1>
		</div>
	{/if}
</div>
