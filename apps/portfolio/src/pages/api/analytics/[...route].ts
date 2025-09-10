import { proxy } from '@aamini/utils/proxy'
import type { APIRoute } from 'astro'

export const ALL: APIRoute = ({ request, params }) => {
	const route = params.route || ''
	return proxy({ request, route })
}
