import heroStats from './__fixtures__/heroStats.json';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  http.get('https://api.opendota.com/api/heroStats', () =>
    HttpResponse.json(heroStats),
  ),
];

export const server = setupServer(...handlers);
