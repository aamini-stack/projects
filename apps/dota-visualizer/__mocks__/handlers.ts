import { http, HttpResponse } from 'msw'
import heroStats from './heroStats.json'

export default [
	http.get('https://api.opendota.com/api/heroStats', () => {
		return HttpResponse.json(heroStats)
	}),
]
