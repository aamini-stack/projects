import type { MiddlewareHandler } from 'astro'

export const prefix = '/api/analytics'

export const config = {
	matcher: '/api/analytics/:path*', // Prefix has to be duplicated.
}

export const handleRequest: MiddlewareHandler = ({ request }, next) => {
	const url = new URL(request.url)

	console.log('[middleware] Starting. URL: ', url.toString())
	if (!url.pathname.startsWith(prefix)) {
		console.log('[middleware] Skipping')
		return next()
	}

	console.log('[middleware] Analytics API call detected')
	const postHogHost = url.pathname.startsWith(`${prefix}/static/`)
		? 'https://us-assets.i.posthog.com'
		: 'https://us.i.posthog.com'

	const remainder = url.pathname.slice(prefix.length)
	const targetUrl = new URL(remainder, postHogHost)
	for (const [v, k] of url.searchParams) {
		targetUrl.searchParams.append(k, v)
	}

	const forwardedHeaders = new Headers(request.headers)
	// Remove hop-by-hop headers that upstreams may reject
	forwardedHeaders.delete('host')
	forwardedHeaders.delete('connection')
	forwardedHeaders.delete('content-length')
	forwardedHeaders.delete('transfer-encoding')
	forwardedHeaders.delete('accept-encoding')

	const apiKey = process.env.ANALYTICS_API_KEY
	if (apiKey && !forwardedHeaders.has('authorization')) {
		forwardedHeaders.set('authorization', `Bearer ${apiKey}`)
	}

	// Build an upstream request preserving method and body
	const method = request.method
	const body = method === 'GET' || method === 'HEAD' ? null : request.body

	try {
		console.log('[middleware] Making proxy call')
		return fetch(targetUrl.toString(), {
			method,
			headers: forwardedHeaders,
			body,
			redirect: 'manual',
			// @ts-ignore
			duplex: 'half',
		})
	} catch (err) {
		console.error('[middleware] Analytics proxy error:', err)
		return new Response('Upstream error', { status: 502 })
	}
}
