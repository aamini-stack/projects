import { PUBLIC_POSTHOG_KEY } from 'astro:env/client'
import { defineMiddleware } from 'astro:middleware'
import { PostHog } from 'posthog-node'

// Initialize PostHog with your project API key
const posthog = new PostHog(PUBLIC_POSTHOG_KEY, {
	host: 'https://us.i.posthog.com',
})

export const onRequest = defineMiddleware(({ request }, next) => {
	const url = new URL(request.url)
	// Extract all UTM parameters
	const utmParams = Object.fromEntries(
		Array.from(url.searchParams).filter(([key]) => key.startsWith('utm_')),
	)

	// If no UTM params, return null (no action needed)
	if (!Object.keys(utmParams).length) {
		return next()
	}

	try {
		posthog.capture({
			distinctId: crypto.randomUUID(),
			event: 'utm_visit',
			properties: {
				...utmParams,
			},
		})
	} catch (error) {
		console.error('Failed to log UTM parameters to PostHog:', error)
	}

	// Create clean URL without UTM parameters
	const cleanUrl = new URL(url)
	for (const key of Object.keys(utmParams)) {
		cleanUrl.searchParams.delete(key)
	}

	return new Response(null, {
		status: 301,
		headers: {
			Location: cleanUrl.toString(),
		},
	})
})
