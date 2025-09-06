import type { MiddlewareHandler } from 'astro'

// Basic proxy middleware for analytics routes.
// Handles dynamic paths and query params and forwards method, headers, and body.
export const onRequest: MiddlewareHandler = async ({ request }, next) => {
	const url = new URL(request.url)

	// Only handle analytics paths; skip otherwise
	if (!url.pathname.startsWith('/api/analytics/')) {
		return next()
	}

	const prefix = '/api/analytics'
	const postHogHost = url.pathname.startsWith(`${prefix}/static/`)
		? 'https://us-assets.i.posthog.com'
		: 'https://us.i.posthog.com'

	// Compute the remainder of the path after /api/analytics/
	const remainder = url.pathname.replace(/^\/api\/analytics\//, '')
	const targetUrl = new URL(remainder, postHogHost)
	// Copy query params
	for (const [v, k] of url.searchParams) {
		targetUrl.searchParams.append(k, v)
	}

	// Clone headers, optionally inject auth from env
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
		const upstreamRes = await fetch(targetUrl.toString(), {
			method,
			headers: forwardedHeaders,
			body,
			redirect: 'manual',
			// @ts-ignore
			duplex: 'half',
		})
		const resHeaders = new Headers(upstreamRes.headers)
		return new Response(upstreamRes.body, {
			status: upstreamRes.status,
			statusText: upstreamRes.statusText,
			headers: resHeaders,
		})
	} catch (err) {
		console.error('Analytics proxy error:', err)
		return new Response('Upstream error', { status: 502 })
	}
}
