import { handleRequest, config as vercelConfig } from '@aamini/utils/proxy'
import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware((context, next) => {
	return handleRequest(context, next)
})

export const config = vercelConfig
