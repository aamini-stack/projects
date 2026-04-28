import { http, HttpResponse } from 'msw'

export default [
	http.get('*', () => {
		return HttpResponse.json({})
	}),
] as const
