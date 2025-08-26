import { rewrite } from '@vercel/functions'

export default function middleware(request: Request) {
	const route = '/dock-mime/v2'
	const url = new URL(request.url)

	if (!url.pathname.startsWith(route)) {
		return undefined
	}
	const hostname = url.pathname.startsWith(`${route}/static`)
		? 'us-assets.i.posthog.com'
		: 'us.i.posthog.com'

	return rewrite(new URL(url.pathname.substring(0, route.length), hostname))
}
