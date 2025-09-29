<script lang="ts">
	import { onMount } from 'svelte'
	
	// This is a simplified version - in a real implementation, you'd fetch data
	let showId: string | null = null
	let ratings: any = null
	let show: any = null
	
	// Check if we have the show ID
	onMount(() => {
		// This would normally be handled by SvelteKit's page store
		// For now, we'll simulate the data loading
	})
	
	function hasRatings(ratings: any): boolean {
		if (!ratings || !ratings.allEpisodeRatings) return false
		for (const seasonRatings of Object.values(ratings.allEpisodeRatings)) {
			for (const episode of Object.values(seasonRatings as any)) {
				if ((episode as any).numVotes > 0) {
					return true
				}
			}
		}
		return false
	}
</script>

<!-- TOP SEARCHBAR -->
<div class="grid grid-cols-[1fr_minmax(auto,600px)_1fr]">
	<div class="col-start-2 w-full">
		<div class="flex w-full items-center pr-4">
			<!-- Home icon -->
			<a href="/">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					x="0px"
					y="0px"
					width="36"
					height="36"
					viewBox="0 0 24 24"
					class="m-2 cursor-pointer transition-opacity hover:opacity-60 dark:fill-neutral-200"
				>
					<path
						d="M 12 2 A 1 1 0 0 0 11.289062 2.296875 L 1.203125 11.097656 A 0.5 0.5 0 0 0 1 11.5 A 0.5 0.5 0 0 0 1.5 12 L 4 12 L 4 20 C 4 20.552 4.448 21 5 21 L 9 21 C 9.552 21 10 20.552 10 20 L 10 14 L 14 14 L 14 20 C 14 20.552 14.448 21 15 21 L 19 21 C 19.552 21 20 20.552 20 20 L 20 12 L 22.5 12 A 0.5 0.5 0 0 0 23 11.5 A 0.5 0.5 0 0 0 22.796875 11.097656 L 12.716797 2.3027344 A 1 1 0 0 0 12.710938 2.296875 A 1 1 0 0 0 12 2 z"
					></path>
				</svg>
			</a>
			<!-- SearchBar would go here -->
		</div>
	</div>
</div>

<div class="flex flex-1 flex-col">
	<div class="p-3">
		<h1 class="text-center text-xl">
			<!-- Show title would go here -->
		</h1>
		<h2 class="text-center text-sm">
			<!-- Show rating would go here -->
		</h2>
	</div>
	<div class="min-h-[250px] flex-1 p-5">
		<!-- Graph would go here -->
		<h1 class="pt-8 text-center text-6xl leading-tight">
			Ratings Page
		</h1>
	</div>
</div>
