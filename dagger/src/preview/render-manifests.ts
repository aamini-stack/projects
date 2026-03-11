export function renderPreviewResourceSet(input: {
	prNumber: number
	previewDomain: string
	apps: string[]
	sha: string
}): string {
	return [
		'apiVersion: fluxcd.controlplane.io/v1',
		'kind: ResourceSet',
		'metadata:',
		`  name: pr-${input.prNumber}`,
		'  namespace: app-preview',
		'spec:',
		'  inputs:',
		...input.apps.flatMap((app) => [
			'    -',
			`      id: "${input.prNumber}-${app}"`,
			`      app: "${app}"`,
			`      sha: "${input.sha}"`,
			`      host: "${app}-pr-${input.prNumber}.${input.previewDomain}"`,
		]),
	].join('\n')
}
