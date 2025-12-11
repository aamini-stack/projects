import { proxy } from '@aamini/utils/proxy'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/analytics/$route')({
	server: {
		handlers: {
			ANY: async ({ request, params }) => {
				const route = params.route || ''
				return proxy({ request, route })
			},
		},
	},
})
