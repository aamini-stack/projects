import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ request, rewrite }) => {
	const route = '/dock-mime'
	const url = new URL(request.url)

	const hostname = url.pathname.startsWith(`${route}/static`)
		? 'us-assets.i.posthog.com'
		: 'us.i.posthog.com'
	const newUrl = new URL(url.pathname.substring(route.length), hostname)
	console.log(newUrl)
	return rewrite(newUrl)
}
