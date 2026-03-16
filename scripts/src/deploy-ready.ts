#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import {
	normalizeDeployReadyEvent,
	type NormalizedDeployReadyEvent,
} from './actions/events/index.ts'

function main(args: string[]): void {
	if (args[0] !== 'normalize' || !args[1]) {
		throw new Error('Usage: deploy-ready.ts normalize <github-event-json>')
	}

	const event = JSON.parse(readFileSync(args[1], 'utf8')) as Parameters<
		typeof normalizeDeployReadyEvent
	>[0]
	console.log(JSON.stringify(normalizeDeployReadyEvent(event)))
}

if (process.argv[1] === import.meta.url.replace('file://', '')) {
	try {
		main(process.argv.slice(2))
	} catch (error) {
		if (error instanceof Error) {
			console.error(error.message)
		} else {
			console.error(String(error))
		}
		process.exit(1)
	}
}

export { normalizeDeployReadyEvent, type NormalizedDeployReadyEvent }
