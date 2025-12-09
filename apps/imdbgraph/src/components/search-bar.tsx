import type { Show } from '#/lib/imdb/types'
import { formatYears } from '#/lib/imdb/types'
import { queryClient } from '#/lib/react-query'
import { cn } from '@aamini/ui/lib/utils'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useCombobox } from 'downshift'
import { Search as SearchIcon, Star } from 'lucide-react'
import { useDeferredValue, useEffect, useState } from 'react'

/** https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/ */
export function SearchBar() {
	const [inputValue, setInputValue] = useState('')
	const deferredValue = useDeferredValue(inputValue)
	const [isRedirecting, setIsRedirecting] = useState(true)

	const {
		isFetching,
		data: searchResults,
		error,
	} = useQuery<Show[] | null>(
		{
			queryKey: ['suggestions', deferredValue],
			queryFn: async ({ signal }) => {
				if (!deferredValue) {
					return null
				}
				const response = await fetch(
					'/api/suggestions?' +
						new URLSearchParams({
							q: deferredValue,
						}).toString(),
					{
						signal,
					},
				)
				return await response.json()
			},
			placeholderData: keepPreviousData,
			enabled: Boolean(inputValue),
		},
		queryClient,
	)

	useEffect(() => {
		setIsRedirecting(false)
	}, [])

	// Setup listener to detect is a link has been clicked to disable input while
	// the page is redirecting.
	useEffect(() => {
		const listener = () => {
			setIsRedirecting(true)
		}
		addEventListener('beforeunload', listener)
		return () => {
			removeEventListener('beforeunload', listener)
		}
	})

	const {
		isOpen,
		getLabelProps,
		getMenuProps,
		getInputProps,
		highlightedIndex,
		getItemProps,
	} = useCombobox({
		items: searchResults ?? [],
		inputValue,
		onInputValueChange: ({ inputValue }) => {
			setInputValue(inputValue)
		},
		itemToString: (item) => item?.title ?? '',
		onSelectedItemChange(event) {
			const { selectedItem } = event
			if (selectedItem && searchResults) {
				window.location.href = `/ratings/${selectedItem.imdbId}`
			}
		},
	})

	return (
		<div className="bg-background text-popover-foreground relative flex h-full w-full flex-col text-sm">
			{/* Hidden label for accessibility */}
			<label
				htmlFor="search-bar-input"
				{...getLabelProps()}
				className="sr-only"
			>
				Search for TV shows
			</label>

			{/* Search Bar */}
			<div className="border-input selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground dark:bg-input/30 has-focus-visible:border-ring has-focus-visible:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 file:text-foreground flex h-10 w-full min-w-0 items-center rounded-xl border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium has-focus-visible:ring-[3px] has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 md:text-sm">
				<SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
				<input
					aria-invalid={Boolean(error)}
					className="flex-1 outline-none"
					placeholder="Search for any TV show..."
					tabIndex={0}
					disabled={isRedirecting}
					id="search-bar-input"
					{...getInputProps()}
				/>
				{/* Loading Icon (Only shows when loading) */}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className={cn('animate-spin px-[2px]', { invisible: !isFetching })}
					data-testid="loading-spinner"
				>
					<title>Loading Icon</title>
					<path d="M21 12a9 9 0 1 1-6.219-8.56" />
				</svg>
			</div>

			{error && (
				<div
					aria-live="polite"
					className="text-destructive px-2 py-1.5 text-center"
				>
					Something went wrong. Please try again.
				</div>
			)}

			{/* Dropdown Menu */}
			{!error && (
				<ul
					className={cn(
						'bg-popover absolute top-full right-0 left-0 z-50 mt-3 w-full rounded-xl border p-2 shadow-lg',
						{
							hidden:
								!(isOpen && deferredValue) ||
								(isFetching && !searchResults?.length),
						},
					)}
					{...getMenuProps()}
				>
					{inputValue && searchResults?.length === 0 && (
						<div className="text-foreground/60 px-2 py-1.5 text-center">
							No TV Shows Found.
						</div>
					)}
					{searchResults?.map((show, index) => (
						<li
							key={show.imdbId}
							className={cn(
								'text-foreground/60 w-full cursor-pointer rounded-md px-2 py-1.5 text-sm outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
								{
									'opacity-50': isFetching,
									'bg-accent text-accent-foreground':
										highlightedIndex === index,
									'hover:bg-foreground/5': highlightedIndex !== index,
								},
							)}
							{...getItemProps({ item: show, index })}
						>
							<a className="flex gap-4" href={`/ratings/${show.imdbId}`}>
								{/* Show Title + Years */}
								<div className="flex flex-1 flex-col">
									<span className="break-words">{show.title}&nbsp;</span>
									<span className="text-foreground/40 text-xs">
										{formatYears(show)}
									</span>
								</div>
								{/* 1-10 Rating + Blue Star Icon */}
								<div className="flex items-center space-x-1 text-sm">
									<span>{`${show.rating.toFixed(1)} / 10.0`}</span>
									<Star className="text-sky-500" />
								</div>
							</a>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
