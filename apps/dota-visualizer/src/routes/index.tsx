import { AppHeader } from '@/components/app-header'
import { defaultViewId, getView, viewsById } from '@/components/views/registry'
import { fetchLatestHeroData } from '@/lib/dota/api'
import { createFileRoute } from '@tanstack/react-router'

interface SearchParams {
	view?: string
}

export const Route = createFileRoute('/')({
	validateSearch: (search: Record<string, unknown>): SearchParams => ({
		view:
			typeof search.view === 'string' && viewsById.has(search.view)
				? search.view
				: defaultViewId,
	}),
	loader: async () => await fetchLatestHeroData(),
	component: Index,
})

function Index() {
	const heroDictionary = Route.useLoaderData()
	const { view: currentViewId } = Route.useSearch()
	const navigate = Route.useNavigate()

	const currentView = getView(currentViewId ?? defaultViewId)
	const ViewComponent = currentView.component

	return (
		<main className="flex min-h-screen flex-col items-center p-24">
			<AppHeader
				currentViewId={currentViewId ?? defaultViewId}
				onViewChange={(viewId) => {
					void navigate({ search: { view: viewId } })
				}}
			/>
			<ViewComponent heroDictionary={heroDictionary} />
		</main>
	)
}
