import { defineMiddleware, sequence } from 'astro/middleware'

const middleware = defineMiddleware(async (context, next) => {
	const route = '/dock-mime/v2'
	const url = new URL(context.request.url)

	if (!url.pathname.startsWith(route)) {
		return next()
	}
	const hostname = url.pathname.startsWith(`${route}/static`)
		? 'us-assets.i.posthog.com'
		: 'us.i.posthog.com'

	return new Response(null, {
		status: 302,
		headers: {
			Location: new URL(url.pathname.substring(0, route.length), hostname).toString(),
		},
	})
})

export const onRequest = sequence(middleware)
