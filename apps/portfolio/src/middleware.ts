import { PUBLIC_POSTHOG_KEY } from 'astro:env/client'
import { defineMiddleware } from 'astro:middleware'
import { PostHog } from 'posthog-node'

// Initialize PostHog with your project API key
const posthog = new PostHog(PUBLIC_POSTHOG_KEY, {
	host: 'https://us.i.posthog.com',
})

export const onRequest = defineMiddleware(async (context, next) => {
	const url = new URL(context.request.url)

	// Extract all UTM parameters
	const utmParams = Object.fromEntries(
		Array.from(url.searchParams).filter(([key]) => key.startsWith('utm_')),
	)

	if (!Object.keys(utmParams).length) {
		return next()
	}

	// Log to PostHog in background (don't await to avoid delays)
	try {
		posthog.capture({
			distinctId: crypto.randomUUID(), // Generate anonymous ID
			event: 'utm_visit',
			properties: {
				...utmParams,
				$current_url: url.pathname,
				$referrer: context.request.headers.get('referer'),
				$user_agent: context.request.headers.get('user-agent'),
				timestamp: new Date().toISOString(),
			},
		})
	} catch (error) {
		console.error('Failed to log UTM parameters to PostHog:', error)
	}

	// Strip UTM
	const cleanUrl = new URL(url)
	for (const key of Object.keys(utmParams)) {
		cleanUrl.searchParams.delete(key)
	}

	console.log(cleanUrl)

	// Redirect
	return new Response(null, {
		status: 301,
		headers: {
			Location: cleanUrl.toString(),
		},
	})
})
