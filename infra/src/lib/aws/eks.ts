import { runAwsJson } from './cli.ts'
import type { AssumedRoleCredentials } from './types.ts'

export function listEksClusters(input: {
	region: string
	credentials: AssumedRoleCredentials
}): string[] {
	const response = runAwsJson<{ clusters: string[] }>(
		['eks', 'list-clusters'],
		{
			region: input.region,
			credentials: input.credentials,
		},
	)

	return response.clusters
}
