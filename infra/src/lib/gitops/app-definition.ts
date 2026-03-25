import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { parse } from 'yaml'

export interface AppDefinition {
	name: string
	namespace: string
	image: {
		repository: string
		policy: string
	}
	stable: {
		host: string
		rootHost?: string
		envFromSecret?: string
	}
	preview: {
		enabled: boolean
	}
}

export function loadAppDefinitions(appsDir: string): AppDefinition[] {
	return readdirSync(appsDir)
		.filter((file) => file.endsWith('.yaml'))
		.sort()
		.map(
			(file) =>
				parse(readFileSync(path.join(appsDir, file), 'utf8')) as AppDefinition,
		)
}
