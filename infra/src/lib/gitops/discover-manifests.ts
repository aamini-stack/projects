import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import type { AppDefinition } from './app-definition.ts'

export function discoverAppManifestDocuments(
	appManifestRoot: string,
	apps: AppDefinition[],
): string[] {
	return apps.flatMap((app) => {
		const manifestDir = path.join(appManifestRoot, 'apps', app.name, 'k8s')
		try {
			return readdirSync(manifestDir)
				.filter((file) => file.endsWith('.yaml'))
				.sort()
				.map((file) =>
					readFileSync(path.join(manifestDir, file), 'utf8').trim(),
				)
				.filter(Boolean)
		} catch {
			return []
		}
	})
}
