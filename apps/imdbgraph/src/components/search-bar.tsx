import type { Show } from '#/lib/imdb/types'
import { formatYears } from '#/lib/imdb/types'
import { queryClient } from '#/lib/react-query'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@aamini/ui/components/input-group'
import { Spinner } from '@aamini/ui/components/spinner'
import { cn } from '@aamini/ui/lib/utils'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useCombobox } from 'downshift'
import { Search as SearchIcon, Star } from 'lucide-react'
import { useDeferredValue, useEffect, useState } from 'react'

/** https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/ */
export function SearchBar({ className }: { className?: string }) {
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

	// Setup listener to detect if a link has been clicked to disable input while
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
		<div
			className={cn(
				'bg-background text-popover-foreground relative flex h-full w-full flex-col text-sm',
				className,
			)}
		>
			{/* Hidden label for accessibility */}
			<label
				htmlFor="search-bar-input"
				{...getLabelProps()}
				className="sr-only"
			>
				Search for TV shows
			</label>

			<InputGroup>
				<InputGroupInput
					aria-invalid={Boolean(error)}
					className="flex-1 outline-none"
					placeholder="Search for any TV show..."
					tabIndex={0}
					disabled={isRedirecting}
					id="search-bar-input"
					{...getInputProps()}
				/>
				<InputGroupAddon>
					<SearchIcon />
				</InputGroupAddon>
				<InputGroupAddon align="inline-end">
					{isFetching && <Spinner />}
				</InputGroupAddon>
			</InputGroup>

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
						'bg-popover absolute left-0 right-0 top-full z-50 mt-3 w-full rounded-xl border p-2 shadow-lg',
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
								'w-full cursor-pointer select-none rounded-md px-2 py-1.5 text-sm outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
								{
									'opacity-50': isFetching,
									'bg-accent text-accent-foreground':
										highlightedIndex === index,
								},
							)}
							{...getItemProps({ item: show, index })}
						>
							<a
								className="flex items-center gap-3"
								href={`/ratings/${show.imdbId}`}
							>
								{/* Show Title + Years */}
								<div className="flex flex-1 flex-col">
									<span className="break-words">{show.title}&nbsp;</span>
									<span
										className={cn('text-xs', {
											'text-accent-foreground': highlightedIndex === index,
										})}
									>
										{formatYears(show)}
									</span>
								</div>
								{/* 1-10 Rating + Blue Star Icon */}
								<div className="flex items-center space-x-1 text-sm">
									<span>{`${show.rating.toFixed(1)} / 10.0`}</span>
									<Star
										className={cn('text-secondary text-xs', {
											'text-accent-foreground': highlightedIndex === index,
										})}
									/>
								</div>
							</a>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
