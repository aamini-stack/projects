import { formatYears, type Show } from '@/lib/imdb/types'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@aamini/ui/components/input-group'
import { Spinner } from '@aamini/ui/components/spinner'
import { cn } from '@aamini/ui/lib/utils'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { Command } from 'cmdk'
import { Search as SearchIcon, Star } from 'lucide-react'
import { useState } from 'react'

/** https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/ */
export function SearchBar({ className }: { className?: string }) {
	const [search, setSearch] = useState('')
	const router = useRouter()

	const {
		isFetching,
		data: searchResults,
		error,
	} = useQuery({
		queryKey: ['suggestions', search],
		queryFn: async () => {
			if (!search) return []
			const response = await fetch(
				`/api/suggestions?q=${encodeURIComponent(search)}`,
			)
			return response.json() as Promise<Show[]>
		},
		enabled: Boolean(search),
		placeholderData: keepPreviousData,
	})

	return (
		<Command
			className={cn(
				'bg-background text-popover-foreground relative flex h-full w-full flex-col text-sm',
				className,
			)}
			shouldFilter={false}
		>
			<InputGroup className="border-border">
				<Command.Input
					value={search}
					onValueChange={setSearch}
					placeholder="Search for any TV show..."
					className="flex-1 outline-none placeholder:text-xs"
					asChild={true}
				>
					<InputGroupInput />
				</Command.Input>

				<InputGroupAddon>
					<SearchIcon />
				</InputGroupAddon>
				<InputGroupAddon align="inline-end">
					{isFetching && <Spinner className="ml-2" />}
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

			{search && !error && searchResults && (
				<Command.List className="bg-popover absolute top-full right-0 left-0 z-50 mt-3 w-full rounded-xl border p-2 shadow-lg">
					{searchResults.length === 0 && !isFetching && (
						<Command.Empty className="text-muted-foreground px-2 py-1.5 text-center">
							No TV Shows Found.
						</Command.Empty>
					)}
					{searchResults.map((show: Show) => (
						<Command.Item
							key={show.imdbId}
							value={show.imdbId}
							asChild
							onSelect={() => {
								void router.navigate({
									to: '/ratings/$id',
									params: { id: show.imdbId },
								})
							}}
							className={cn(
								'text-foreground w-full cursor-pointer rounded-md px-2 py-1.5 text-sm outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
								{
									'opacity-50': isFetching,
								},
							)}
						>
							<Link
								to="/ratings/$id"
								params={{ id: show.imdbId }}
								className="aria-selected:bg-accent aria-selected:text-accent-foreground text-foreground flex cursor-pointer gap-4 rounded-md px-2 py-1.5 text-sm outline-none select-none"
							>
								{/* Show Title + Years */}
								<div className="flex flex-1 flex-col">
									<span className="wrap-break-word">{show.title}&nbsp;</span>
									<span className="text-muted-foreground text-xs">
										{formatYears(show)}
									</span>
								</div>
								{/* 1-10 Rating + Blue Star Icon */}
								<div className="text-muted-foreground flex items-center space-x-1 text-sm">
									<span>{`${show.rating.toFixed(1)} / 10.0`}</span>
									<Star className="size-4 text-purple-400" />
								</div>
							</Link>
						</Command.Item>
					))}
				</Command.List>
			)}
		</Command>
	)
}
