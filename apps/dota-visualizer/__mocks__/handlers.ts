import { HttpResponse, http } from 'msw'
import heroStats from './heroStats.json' with { type: 'json' }

export const handlers = [
	http.get('https://api.opendota.com/api/heroStats', () =>
		HttpResponse.json(heroStats),
	),
]
