import { buildBootstrapPlan } from './build-plan.ts'
import { parseBootstrapCli } from './parse-cli.ts'
import { printBootstrapPlan } from './print-plan.ts'
import { resolveBootstrapContext } from './resolve-context.ts'
import { runBootstrapPlan } from './run-plan.ts'

async function main(): Promise<void> {
	const options = parseBootstrapCli(process.argv)
	if (!options) {
		return
	}

	const context = await resolveBootstrapContext(options)
	const plan = buildBootstrapPlan(context)
	printBootstrapPlan(plan)
	await runBootstrapPlan(plan)
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error)
	console.error(`Bootstrap failed: ${message}`)
	process.exit(1)
})
