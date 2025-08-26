import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (context, next) => {
	const requestPath = context.url.pathname
	if (!requestPath.startsWith('/dock-mime/v2')) {
		return await next()
	}
	const url = new URL(context.url)
	const hostname = url.pathname.startsWith('/dock-mime/v2/static')
		? 'us-assets.i.posthog.com'
		: 'us.i.posthog.com'
	const requestHeaders = new Headers(context.request.headers)
	requestHeaders.set('host', hostname)

	url.protocol = 'https'
	url.hostname = hostname
	url.port = '443'
	url.pathname = url.pathname.replace(/^\/dock-mime\/v2/, '')

	console.log(url.toString())
	return context.rewrite(url)
})
