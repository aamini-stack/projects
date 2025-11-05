import { App } from 'cdk8s'
import { PackagesChart } from '@/charts/packages'
import { SystemChart } from '@/charts/system'
import { GitOpsChart } from '@/charts/gitops'

// Get environment from CLI argument or default to staging
const environment = (process.argv[2] as 'staging' | 'prod') || 'staging'

if (!['staging', 'prod'].includes(environment)) {
	console.error('Invalid environment. Use: staging or prod')
	process.exit(1)
}

const app = new App({
	outdir: `generated/${environment}`,
	outputFileExtension: '.yaml'
})

// Create charts in dependency order
new PackagesChart(app, 'packages', {
	namespace: 'flux-system',
})

new SystemChart(app, 'system', {
	environment,
	namespace: 'networking',
})

new GitOpsChart(app, 'gitops', {
	environment,
	namespace: 'flux-system',
})

app.synth()
