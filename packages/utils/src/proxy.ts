export const proxy = async ({
	request,
	route,
}: {
	request: Request
	route: string
}) => {
	const url = new URL(request.url)

	console.log('[proxy.ts]', url.toString())

	const postHogHost = route.startsWith('static/')
		? 'https://us-assets.i.posthog.com'
		: 'https://us.i.posthog.com'

	const targetUrl = new URL(`/${route}`, postHogHost)
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
		return await fetch(targetUrl.toString(), {
			method,
			headers: forwardedHeaders,
			body,
			redirect: 'manual',
			// @ts-expect-error - duplex is required for streaming request bodies but not in TypeScript definitions
			duplex: 'half',
		})
	} catch (err) {
		console.error('[proxy.ts] Analytics proxy error:', err)
		return new Response('Upstream error', { status: 502 })
	}
}
