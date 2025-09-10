import { handleRequest, config as vercelConfig } from '@aamini/utils/proxy'
import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(handleRequest)

export const config = vercelConfig
