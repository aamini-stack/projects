import { rewrite } from '@vercel/functions'

export const config = {
	matcher: '/dock-mime/:path*',
}

export default function middleware(request: Request) {
	const prefix = '/dock-mime'
	const url = new URL(request.url)
	const postHogHost = url.pathname.startsWith(`${prefix}/static/`)
		? 'https://us-assets.i.posthog.com'
		: 'https://us.i.posthog.com'
	const requestHeaders = new Headers(request.headers)
	requestHeaders.set('host', postHogHost)

	const newPath = url.pathname.slice(prefix.length + 1)
	return rewrite(new URL(newPath, postHogHost))
}
