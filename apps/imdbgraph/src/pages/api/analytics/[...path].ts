import type { APIRoute } from 'astro'

/**
 * Analytics proxy API route for PostHog
 *
 * This proxies requests from /api/analytics/* to PostHog's endpoints
 * to avoid ad-blocker detection and provide better analytics reliability.
 *
 * Examples:
 * - /api/analytics/capture -> https://us.i.posthog.com/capture
 * - /api/analytics/static/array.js -> https://us-assets.i.posthog.com/static/array.js
 */
export const ALL: APIRoute = async ({ params, request }) => {
	try {
		const path = params.path || ''

		// Determine the correct PostHog host based on the path
		const isStaticAsset = path.startsWith('static/')
		const postHogHost = isStaticAsset
			? 'https://us-assets.i.posthog.com'
			: 'https://us.i.posthog.com'

		// Construct the target URL
		const targetUrl = new URL(path, postHogHost)

		// Copy search params from original request
		const originalUrl = new URL(request.url)
		for (const [key, value] of originalUrl.searchParams) {
			targetUrl.searchParams.set(key, value)
		}

		// Prepare headers for the proxied request
		const headers = new Headers()

		// Copy relevant headers from the original request
		const headersToForward = [
			'content-type',
			'user-agent',
			'accept',
			'accept-encoding',
			'accept-language',
			'authorization',
		]

		for (const header of headersToForward) {
			const value = request.headers.get(header)
			if (value) {
				headers.set(header, value)
			}
		}

		// Set the correct host header
		headers.set('host', new URL(postHogHost).host)

		// Log the proxied request for debugging
		console.log(`[Analytics Proxy] ${request.method} ${targetUrl.toString()}`)

		// Make the proxied request
		const fetchOptions: RequestInit = {
			method: request.method,
			headers,
		}

		// Only add body for methods that support it
		if (request.method !== 'GET' && request.method !== 'HEAD') {
			fetchOptions.body = await request.arrayBuffer()
		}

		const response = await fetch(targetUrl.toString(), fetchOptions)

		// Copy response headers
		const responseHeaders = new Headers()

		// Forward most headers from PostHog response
		for (const [key, value] of response.headers) {
			// Skip headers that might cause issues
			if (
				!['host', 'connection', 'transfer-encoding'].includes(key.toLowerCase())
			) {
				responseHeaders.set(key, value)
			}
		}

		// Add CORS headers if needed
		responseHeaders.set('Access-Control-Allow-Origin', '*')
		responseHeaders.set(
			'Access-Control-Allow-Methods',
			'GET, POST, PUT, DELETE, OPTIONS',
		)
		responseHeaders.set(
			'Access-Control-Allow-Headers',
			'Content-Type, Authorization',
		)

		// Handle preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: responseHeaders,
			})
		}

		// Return the proxied response
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders,
		})
	} catch (error) {
		console.error('[Analytics Proxy] Error:', error)

		return new Response(
			JSON.stringify({
				error: 'Proxy request failed',
				details: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		)
	}
}
