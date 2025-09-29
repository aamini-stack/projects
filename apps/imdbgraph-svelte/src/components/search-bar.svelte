<script lang="ts">
	import { formatYears } from '#/lib/imdb/types'
	
	// Props
	export let placeholder = "Search for any TV show..."
	
	// State
	let inputValue = ''
	let isRedirecting = false
	let isFetching = false
	let searchResults: any[] | null = null
	let error: Error | null = null
	
	// Simulated data
	const mockShows = [
		{ imdbId: 'tt0123456', title: 'Test Show', year: 2020, rating: 8.5, numVotes: 10000 },
		{ imdbId: 'tt0123457', title: 'Another Show', year: 2021, rating: 7.2, numVotes: 8000 }
	]
	
	// Handle input changes
	function handleInputChange(event: Event) {
		const value = (event.target as HTMLInputElement).value
		inputValue = value
		
		if (value) {
			isFetching = true
			// Simulate API call delay
			setTimeout(() => {
				searchResults = mockShows.filter(show => 
					show.title.toLowerCase().includes(value.toLowerCase())
				)
				isFetching = false
			}, 300)
		} else {
			searchResults = null
		}
	}
	
	// Handle selection
	function handleSelect(show: any) {
		if (show) {
			// In a real app, this would navigate to the show page
			console.log('Selected:', show)
		}
	}
</script>

<div class="bg-background text-popover-foreground relative flex h-full w-full flex-col text-sm">
	<!-- Hidden label for accessibility -->
	<label for="search-bar-input" class="sr-only">
		Search for TV shows
	</label>

	<!-- Search Bar -->
	<div class="border-input shadow-xs selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground dark:bg-input/30 has-focus-visible:border-ring has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-aria-invalid:border-destructive has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 file:text-foreground flex h-10 w-full min-w-0 items-center rounded-xl border bg-transparent px-3 py-1 text-base outline-none transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium md:text-sm">
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 h-4 w-4 shrink-0 opacity-50">
			<title>Search Icon</title>
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.35-4.35" />
		</svg>
		<input
			aria-invalid={error !== null}
			class="flex-1 outline-none"
			placeholder={placeholder}
			type="text"
			id="search-bar-input"
			on:input={handleInputChange}
			disabled={isRedirecting}
		/>
		<!-- Loading Icon (Only shows when loading) -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class:animate-spin={isFetching}
			class:invisible={!isFetching}
			data-testid="loading-spinner"
		>
			<title>Loading Icon</title>
			<path d="M21 12a9 9 0 1 1-6.219-8.56" />
		</svg>
	</div>

	{#if error}
		<div
			aria-live="polite"
			class="text-destructive px-2 py-1.5 text-center"
		>
			Something went wrong. Please try again.
		</div>
	{/if}

	<!-- Dropdown Menu -->
	{#if !error}
		<ul
			class:hidden={!(searchResults && inputValue && !isFetching)}
			class="bg-popover absolute left-0 right-0 top-full z-50 mt-3 w-full rounded-xl border p-2 shadow-lg"
		>
			{#if inputValue && searchResults?.length === 0}
				<div class="text-foreground/60 px-2 py-1.5 text-center">
					No TV Shows Found.
				</div>
			{/if}
			{#each searchResults || [] as show (show.imdbId)}
				<li
					class="text-foreground/60 w-full cursor-pointer select-none rounded-md px-2 py-1.5 text-sm outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
					class:opacity-50={isFetching}
					on:click={() => handleSelect(show)}
				>
					<a class="flex gap-4" href="#">
						<!-- Show Title + Years -->
						<div class="flex flex-1 flex-col">
							<span class="break-words">{show.title}&nbsp;</span>
							<span class="text-foreground/40 text-xs">
								{formatYears(show)}
							</span>
						</div>
						<!-- 1-10 Rating + Blue Star Icon -->
						<div class="flex items-center space-x-1 text-sm">
							<span>{`${show.rating.toFixed(1)} / 10.0`}</span>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-sky-500">
								<title>Star Icon</title>
								<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
							</svg>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
