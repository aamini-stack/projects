import { EventGallery } from '#/components/event-gallery'
import { getGallery } from '#/lib/galleries'
import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/events/$slug')({
	loader: async ({ params }) => {
		const gallery = getGallery(params.slug)
		if (!gallery) throw notFound()
		return gallery
	},
	component: EventPage,
})

function EventPage() {
	const gallery = Route.useLoaderData()
	return <EventGallery gallery={gallery} />
}
