import { buildBootstrapPlan } from '../lib/bootstrap/build-plan.ts'
import { parseBootstrapCli } from '../lib/bootstrap/parse-cli.ts'
import { printBootstrapPlan } from '../lib/bootstrap/print-plan.ts'
import { resolveBootstrapContext } from '../lib/bootstrap/resolve-context.ts'
import { runBootstrapPlan } from '../lib/bootstrap/run-plan.ts'

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
