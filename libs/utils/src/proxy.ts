import type { MiddlewareHandler } from 'astro'

/**
 * Proxies analytics requests to PostHog endpoints
 * @param request - The incoming request object
 * @param routeParams - The path parameters after the prefix
 * @returns Response or Promise<Response> from the upstream PostHog service
 */
export const proxyAnalyticsRequest = (
	request: Request,
	routeParams: string,
): Response | Promise<Response> => {
	const url = new URL(request.url)

	console.log('[analytics] Starting. URL: ', url.toString())
	console.log('[analytics] Analytics API call detected')

	const postHogHost = routeParams.startsWith('static/')
		? 'https://us-assets.i.posthog.com'
		: 'https://us.i.posthog.com'

	const targetUrl = new URL(`/${routeParams}`, postHogHost)
	for (const [k, v] of url.searchParams) {
		targetUrl.searchParams.append(k, v)
	}

	// Remove hop-by-hop headers that upstreams may reject
	// https://0xn3va.gitbook.io/cheat-sheets/web-application/abusing-http-hop-by-hop-request-headers#hop-by-hop-request-headers
	// https://datatracker.ietf.org/doc/html/rfc2616#section-13.5.1
	const forwardedHeaders = new Headers(request.headers)
	forwardedHeaders.delete('keep-alive')
	forwardedHeaders.delete('transfer-encoding')
	forwardedHeaders.delete('te')
	forwardedHeaders.delete('connection')
	forwardedHeaders.delete('trailer')
	forwardedHeaders.delete('upgrade')
	forwardedHeaders.delete('proxy-authorization')
	forwardedHeaders.delete('proxy-authenticate')

	// Build an upstream request preserving method and body
	const method = request.method
	const body = method === 'GET' || method === 'HEAD' ? null : request.body

	try {
		console.log('[analytics] Making proxy call')
		return fetch(targetUrl.toString(), {
			method,
			headers: forwardedHeaders,
			body,
			redirect: 'manual',
			// @ts-expect-error - duplex is required for streaming request bodies but not in TypeScript definitions
			duplex: 'half',
		})
	} catch (err) {
		console.error('[analytics] Analytics proxy error:', err)
		return new Response('Upstream error', { status: 502 })
	}
}

/**
 * Astro middleware handler for analytics requests
 * @param request - The request context
 * @param next - The next middleware function
 * @returns Response from the proxy or next middleware
 */
export const handleRequest: MiddlewareHandler = ({ request }, next) => {
	const url = new URL(request.url)

	console.log('[middleware] Starting. URL: ', url.toString())
	if (!url.pathname.startsWith(prefix)) {
		console.log('[middleware] Skipping')
		return next()
	}

	const remainder = url.pathname.slice(prefix.length + 1) // Remove leading slash
	return proxyAnalyticsRequest(request, remainder)
}
