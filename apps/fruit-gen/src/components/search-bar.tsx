'use client'

import { Search as SearchIcon } from 'lucide-react'

/** https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/ */
export function SearchBar() {
	return (
		<div className="bg-background text-popover-foreground relative flex h-full w-full flex-col text-sm">
			{/* Hidden label for accessibility */}
			<label htmlFor="search-bar-input" className="sr-only">
				Search for TV shows
			</label>

			{/* Search Bar */}
			<div className="border-input shadow-xs selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground dark:bg-input/30 has-focus-visible:border-ring has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-aria-invalid:border-destructive has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 file:text-foreground flex h-10 w-full min-w-0 items-center rounded-xl border bg-transparent px-3 py-1 text-base outline-none transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium md:text-sm">
				<SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
				<input
					className="flex-1 outline-none"
					placeholder="Search for any TV show..."
					tabIndex={0}
					id="search-bar-input"
				/>
			</div>
		</div>
	)
}
