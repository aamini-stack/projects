import type { APIRoute } from 'astro'
import { proxyAnalyticsRequest } from '@aamini/utils/proxy'

export const ALL: APIRoute = ({ request, params }) => {
	const route = params.route || ''
	return proxyAnalyticsRequest(request, route)
}