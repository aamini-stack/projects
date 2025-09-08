import { handleRequest } from '@aamini/utils/proxy'
import type { MiddlewareHandler } from 'astro'

export const onRequest: MiddlewareHandler = (context, next) => {
	return handleRequest(context, next)
}
