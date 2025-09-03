import { defineMiddleware } from 'astro:middleware'
import { PostHog } from 'posthog-node'

// Initialize PostHog with your project API key
const posthog = new PostHog('phc_LWC2pawiFEeBiZTp3rxnzsebkRVJ1ZkOwsTiZARWXgC', {
	host: 'https://us.i.posthog.com',
})

export const onRequest = defineMiddleware(async (context, next) => {
	const url = new URL(context.request.url)
	
	// Extract all UTM parameters
	const utmParams: Record<string, string> = {}
	let hasUtms = false
	
	for (const [key, value] of url.searchParams) {
		if (key.startsWith('utm_')) {
			utmParams[key] = value
			hasUtms = true
		}
	}
	
	if (hasUtms) {
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
		
		// Create clean URL without UTM parameters
		const cleanUrl = new URL(url)
		for (const key of Object.keys(utmParams)) {
			cleanUrl.searchParams.delete(key)
		}
		
		const redirectUrl = cleanUrl.pathname + (cleanUrl.search || '')
		
		// Redirect to clean URL
		return new Response(null, {
			status: 301,
			headers: {
				Location: redirectUrl,
			},
		})
	}
	
	// No UTM parameters found, continue normally
	return next()
})