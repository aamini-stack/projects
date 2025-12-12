import { SearchBar } from '@/components/search-bar'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	component: Home,
})

function Home() {
	return (
		<div className="flex flex-1 flex-col items-center gap-6 pt-8 md:gap-9 md:pt-20">
			<h1 className="inline px-8 text-center text-4xl font-semibold tracking-tight text-balance md:text-5xl lg:text-6xl">
				IMDb Graph
			</h1>
			<div className="flex w-full max-w-lg min-w-sm justify-center px-8">
				<SearchBar />
			</div>
		</div>
	)
}
